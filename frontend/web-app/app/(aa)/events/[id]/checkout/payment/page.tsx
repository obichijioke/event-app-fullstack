'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StepIndicator } from '@/components/checkout/step-indicator';
import { OrderSummary } from '@/components/checkout/order-summary';
import { CountdownTimer } from '@/components/checkout/countdown-timer';
import { eventsApi, Event } from '@/lib/api/events-api';
import { ticketsApi, TicketType } from '@/lib/api/tickets-api';
import { ordersApi, Order } from '@/lib/api/orders-api';
import { getErrorMessage } from '@/lib/utils/error-message';
import { CreditCard, Building2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

type PaymentMethod = 'card' | 'bank' | 'ussd';

const RESOLVED_PAYMENT_PROVIDER =
  (process.env.NEXT_PUBLIC_CHECKOUT_PAYMENT_PROVIDER as
    | 'stripe'
    | 'paystack'
    | 'test'
    | undefined) ?? 'test';

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

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Timer for hold expiration (10 minutes from now)
  const [holdExpiresAt] = useState(() => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
  });

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
      setEvent(eventData);
      setTicketTypes(ticketTypesData);
      setOrder(orderData);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load order. Please try again.');
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

  const handlePayment = async () => {
    if (!order) return;

    // Basic validation
    if (paymentMethod === 'card') {
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        toast.error('Please fill in all card details');
        return;
      }

      if (cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        toast.error('Please enter expiry date in MM/YY format');
        return;
      }

      if (cvv.length < 3 || cvv.length > 4) {
        toast.error('Please enter a valid CVV');
        return;
      }
    }

    try {
      setProcessing(true);
      setPaymentError(null);

      // Initiate payment
      const paymentResponse = await ordersApi.initiatePayment(order.id, {
        provider: RESOLVED_PAYMENT_PROVIDER,
        returnUrl: `${window.location.origin}/events/${eventId}/checkout/confirmation?orderId=${order.id}`,
        cancelUrl: `${window.location.origin}/events/${eventId}/checkout/payment?orderId=${order.id}`,
      });

      if (RESOLVED_PAYMENT_PROVIDER === 'test') {
        await ordersApi.processPayment({
          orderId: order.id,
          paymentIntentId:
            paymentResponse?.providerIntent ||
            paymentResponse?.payment?.providerIntent,
        });
      }

      toast.success('Payment processed successfully!');
      router.push(`/events/${eventId}/checkout/confirmation?orderId=${order.id}`);
    } catch (error) {
      const message = getErrorMessage(error, 'Payment failed. Please try again.');
      console.error('Payment failed:', error);
      setPaymentError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleHoldExpire = () => {
    toast.error('Your ticket reservation has expired.');
    router.push(`/events/${eventId}/checkout`);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
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
            <p className="text-sm font-semibold uppercase tracking-wide text-destructive">Error</p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">Unable to load payment</h1>
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

            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground">Payment Method</h2>
              <p className="text-sm text-muted-foreground">
                Choose how you&apos;d like to complete your purchase.
              </p>
              <div className="mt-4 space-y-3">
                {[
                  {
                    id: 'card',
                    label: 'Credit/Debit Card',
                    description: 'Visa, Mastercard, Verve',
                    icon: CreditCard,
                  },
                  {
                    id: 'bank',
                    label: 'Bank Transfer',
                    description: 'Direct bank transfer',
                    icon: Building2,
                  },
                  {
                    id: 'ussd',
                    label: 'USSD',
                    description: 'Pay with USSD code',
                    icon: Smartphone,
                  },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                      paymentMethod === option.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/70 hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.id}
                      checked={paymentMethod === option.id}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="h-4 w-4"
                    />
                    <option.icon className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {paymentMethod === 'card' && (
              <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground">Card Details</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the card information that matches the billing address.
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full rounded-xl border border-border/70 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="w-full rounded-xl border border-border/70 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        maxLength={5}
                        className="w-full rounded-xl border border-border/70 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        maxLength={4}
                        className="w-full rounded-xl border border-border/70 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {paymentMethod === 'bank' && (
              <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground">Bank Transfer Details</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Transfer the exact amount to the account below:
                  </p>
                  <div className="space-y-2 rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank Name:</span>
                      <span className="font-medium">First Bank of Nigeria</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-medium">1234567890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="font-medium">EventFlow Limited</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="text-lg font-bold text-foreground">
                        ${(order.totalCents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use order ID <span className="font-mono font-medium">{order.id}</span> as
                    payment reference.
                  </p>
                </div>
              </section>
            )}

            {paymentMethod === 'ussd' && (
              <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-foreground">USSD Payment</h2>
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Dial the USSD code below to complete your payment:
                  </p>
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4 text-center">
                    <p className="font-mono text-3xl font-bold text-foreground">
                      *737*50*{order.id.slice(-8)}#
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Follow the prompts on your phone. Your order will be confirmed automatically
                    once payment is received.
                  </p>
                </div>
              </section>
            )}
          </div>

          <div>
            <OrderSummary
              event={event}
              ticketSelections={ticketSelections}
              ticketTypes={ticketTypes}
              onContinue={handlePayment}
              buttonText={processing ? 'Processing...' : 'Pay Now'}
              buttonDisabled={processing}
              showSecurityBadges
              stepLabel="Step 2 of 3"
              actionErrorMessage={paymentError || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
