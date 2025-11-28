'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StepIndicator } from '@/components/checkout/step-indicator';
import { OrderSummary } from '@/components/checkout/order-summary';
import { CountdownTimer } from '@/components/checkout/countdown-timer';
import { StripePaymentForm } from '@/components/checkout/stripe-payment-form';
import { PaystackPaymentButton } from '@/components/checkout/paystack-payment-button';
import {
  PaymentProviderSelector,
  PaymentProviderType,
} from '@/components/checkout/payment-provider-selector';
import { PublicEvent as Event } from '@/lib/events'
import { eventsApi } from '@/lib/api/events-api';
import { ticketsApi, TicketType } from '@/lib/api/tickets-api';
import { ordersApi, Order } from '@/lib/api/orders-api';
import { getErrorMessage } from '@/lib/utils/error-message';
import { useAuth } from '@/components/auth';
import toast from 'react-hot-toast';

// Payment provider configuration from environment
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

// Initialize Stripe (only if key is available)
const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

const STEPS = [
  { id: 1, title: 'Select Tickets', subtitle: 'Choose your tickets' },
  { id: 2, title: 'Review & Payment', subtitle: 'Complete your purchase' },
  { id: 3, title: 'Confirmation', subtitle: 'Order confirmed' },
];

type Props = {
  params: Promise<{ id: string }>;
};

export default function PaymentPage({ params }: Props) {
  const { id: eventId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Payment state
  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProviderType>('stripe');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paystackReference, setPaystackReference] = useState<string | null>(null);
  const [initializingPayment, setInitializingPayment] = useState(false);

  // Timer for hold expiration (10 minutes from now)
  const [holdExpiresAt] = useState(() => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
  });

  // Determine available providers
  const stripeAvailable = !!STRIPE_PUBLISHABLE_KEY && !!stripePromise;
  const paystackAvailable = !!PAYSTACK_PUBLIC_KEY;

  // Auto-select available provider
  useEffect(() => {
    if (stripeAvailable && !paystackAvailable) {
      setSelectedProvider('stripe');
    } else if (paystackAvailable && !stripeAvailable) {
      setSelectedProvider('paystack');
    }
  }, [stripeAvailable, paystackAvailable]);

  const loadPaymentData = useCallback(async () => {
    if (!orderId) {
      toast.error('No order found');
      router.push(`/events/${eventId}/checkout`);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);
      const [eventData, ticketTypesData, orderData] = await Promise.all([
        eventsApi.getEvent(eventId),
        ticketsApi.getTicketTypes(eventId),
        ordersApi.getOrder(orderId),
      ]);
      const isFreeOrder =
        typeof orderData.totalCents === 'bigint'
          ? orderData.totalCents === BigInt(0)
          : Number(orderData.totalCents) === 0;

      if (isFreeOrder || (orderData as any).isFreeOrder) {
        setLoading(false);
        router.push(
          `/events/${eventId}/checkout/confirmation?orderId=${orderId}`,
        );
        return;
      }

      setEvent(eventData);
      setTicketTypes(ticketTypesData);
      setOrder(orderData);
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Failed to load order. Please try again.',
      );
      console.error('Failed to load data:', error);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [eventId, orderId, router]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  // Initialize payment when provider is selected
  useEffect(() => {
    if (!order || initializingPayment) return;

    const isFreeOrder =
      typeof order.totalCents === 'bigint'
        ? order.totalCents === BigInt(0)
        : Number(order.totalCents) === 0;
    if (isFreeOrder || (order as any).isFreeOrder) {
      router.push(
        `/events/${eventId}/checkout/confirmation?orderId=${order.id}`,
      );
      return;
    }

    const initializePayment = async () => {
      try {
        setInitializingPayment(true);

        const paymentResponse = await ordersApi.initiatePayment(order.id, {
          provider: selectedProvider,
          returnUrl: `${window.location.origin}/events/${eventId}/checkout/confirmation?orderId=${order.id}`,
          cancelUrl: `${window.location.origin}/events/${eventId}/checkout/payment?orderId=${order.id}`,
        });

        if (selectedProvider === 'stripe') {
          setClientSecret(paymentResponse.clientSecret || null);
        } else if (selectedProvider === 'paystack') {
          setPaystackReference(paymentResponse.reference || null);
        }
      } catch (error) {
        const message = getErrorMessage(
          error,
          'Failed to initialize payment. Please try again.',
        );
        console.error('Payment initialization failed:', error);
        toast.error(message);
      } finally {
        setInitializingPayment(false);
      }
    };

    // Reset payment state when provider changes
    setClientSecret(null);
    setPaystackReference(null);

    initializePayment();
  }, [selectedProvider, order, eventId]);

  const handlePaymentSuccess = async (paymentIntentId?: string) => {
    if (paymentIntentId && order) {
      try {
        // Explicitly notify backend of success to ensure immediate status update
        // This acts as a fallback/redundancy to webhooks
        await ordersApi.processPayment({
          orderId: order.id,
          paymentIntentId,
        });
      } catch (error) {
        console.error('Manual payment confirmation failed:', error);
        // We continue anyway as the webhook might have succeeded
        // or polling will catch it eventually
      }
    }
    
    toast.success('Payment successful!');
    router.push(`/events/${eventId}/checkout/confirmation?orderId=${order?.id}`);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(error);
  };

  const handlePaystackSuccess = async (reference: string) => {
    // Use the unified success handler which now performs explicit verification
    await handlePaymentSuccess(reference);
  };

  const handlePaystackClose = () => {
    toast.error('Payment cancelled');
  };

  const handleHoldExpire = () => {
    toast.error('Your ticket reservation has expired.');
    router.push(`/events/${eventId}/checkout`);
  };

  if (loading && !loadError) {
    return (
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading payment details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl rounded-3xl border border-border/70 bg-card p-10 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-destructive">
              Error
            </p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">
              Unable to load payment
            </h1>
            <p className="mt-2 text-muted-foreground">{loadError}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                onClick={() => router.push(`/events/${eventId}/checkout`)}
              >
                Back to Checkout
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                onClick={loadPaymentData}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event || !order) {
    return (
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Order not found</h1>
            <button
              type="button"
              onClick={() => router.push(`/events/${eventId}/checkout`)}
              className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition hover:opacity-90"
            >
              Back to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create ticket selections map from order items
  const ticketSelections = new Map<string, number>();
  order.items?.forEach((item) => {
    ticketSelections.set(item.ticketTypeId, item.quantity);
  });

  return (
    <div className="bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <StepIndicator currentStep={2} steps={STEPS} />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <CountdownTimer expiresAt={holdExpiresAt} onExpire={handleHoldExpire} />

            {/* Payment Provider Selector */}
            <PaymentProviderSelector
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
              stripeAvailable={stripeAvailable}
              paystackAvailable={paystackAvailable}
            />

            {/* Payment Form based on selected provider */}
            {initializingPayment ? (
              <div className="rounded-3xl border border-border/70 bg-card p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">
                  Initializing payment with {selectedProvider}...
                </p>
              </div>
            ) : selectedProvider === 'stripe' && stripeAvailable && clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm
                  amount={Number(order.totalCents)}
                  currency={order.currency}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  returnUrl={`${window.location.origin}/events/${eventId}/checkout/confirmation?orderId=${order.id}`}
                />
              </Elements>
            ) : selectedProvider === 'paystack' &&
              paystackAvailable &&
              paystackReference ? (
              <PaystackPaymentButton
                email={user?.email || ''}
                amount={Number(order.totalCents)}
                currency={order.currency}
                reference={paystackReference}
                publicKey={PAYSTACK_PUBLIC_KEY!}
                onSuccess={handlePaystackSuccess}
                onClose={handlePaystackClose}
              />
            ) : (
              <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-center">
                <p className="font-semibold text-destructive">
                  Payment provider not available
                </p>
                <p className="mt-1 text-sm text-destructive/80">
                  Please select a different payment method or contact support.
                </p>
              </div>
            )}
          </div>

          <div>
            <OrderSummary
              event={event}
              ticketSelections={ticketSelections}
              ticketTypes={ticketTypes}
              showSecurityBadges
              stepLabel="Step 2 of 3"
              overrideFeesCents={Number(order.feesCents)}
              overrideDiscountCents={Number(order.discountCents)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
