'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { StepIndicator } from '@/components/checkout/step-indicator';
import { eventsApi, type Event } from '@/lib/api/events-api';
import { ordersApi, type Order } from '@/lib/api/orders-api';
import { CheckCircle2, Download, Mail, Calendar, MapPin, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/utils/error-message';

const STEPS = [
  { id: 1, title: 'Select Tickets', subtitle: 'Choose your tickets' },
  { id: 2, title: 'Review & Payment', subtitle: 'Complete your purchase' },
  { id: 3, title: 'Confirmation', subtitle: 'Order confirmed' },
];

type Props = {
  params: Promise<{ id: string }>;
};

export default function ConfirmationPage({ params }: Props) {
  const { id: eventId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [event, setEvent] = useState<Event | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!orderId) {
      toast.error('No order found');
      router.push(`/events/${eventId}`);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);
      const [eventData, orderData] = await Promise.all([
        eventsApi.getEvent(eventId),
        ordersApi.getOrder(orderId),
      ]);
      setEvent(eventData);
      setOrder(orderData);

      if (orderData.status === 'pending') {
        pollOrderStatus(orderId);
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load order details');
      console.error('Failed to load confirmation data:', error);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [eventId, orderId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pollOrderStatus = async (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 2000;

    const poll = setInterval(async () => {
      attempts += 1;
      try {
        const updatedOrder = await ordersApi.getOrder(orderId);
        if (updatedOrder.status === 'paid') {
          setOrder(updatedOrder);
          clearInterval(poll);
          toast.success('Payment confirmed!');
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
        }
      } catch (error) {
        console.error('Error polling order status:', error);
        clearInterval(poll);
      }
    }, pollInterval);
  };

  const handleDownloadTickets = () => {
    toast.success('Tickets will be downloaded shortly');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading && !loadError) {
    return (
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading order confirmation...</p>
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
            <h1 className="mt-2 text-2xl font-bold text-foreground">Unable to load confirmation</h1>
            <p className="mt-2 text-muted-foreground">{loadError}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                onClick={() => router.push('/events')}
              >
                Browse Events
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                onClick={loadData}
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
              onClick={() => router.push('/events')}
              className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition hover:opacity-90"
            >
              Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = order.status === 'paid';
  const totalTickets = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const nextSteps = [
    { id: 'email', text: 'You will receive a confirmation email with your tickets attached within the next few minutes.' },
    { id: 'dashboard', text: 'You can view and manage your tickets in your account dashboard.' },
    { id: 'checkin', text: 'Present your tickets (digital or printed) at the event entrance for check-in.' },
    { id: 'support', text: 'Need help? Contact our support team.' },
  ] as const;

  return (
    <div className="bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <StepIndicator currentStep={3} steps={STEPS} />

        <div className="mx-auto max-w-3xl space-y-8">
          <div className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">
              {isPaid ? 'Order Confirmed!' : 'Order Received!'}
            </h1>
            <p className="mb-6 text-muted-foreground">
              {isPaid
                ? 'Your tickets have been purchased successfully.'
                : 'We are processing your payment. You will receive a confirmation email shortly.'}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 px-5 py-2">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="font-mono text-sm font-semibold">{order.id}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="mb-6 flex gap-4">
              {event.bannerImageUrl && (
                <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-2xl">
                  <Image
                    src={event.bannerImageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="mb-3 text-2xl font-bold text-foreground">{event.title}</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(event.startTime)}</span>
                  </div>
                  {event.venue && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {event.venue.name}
                        {event.venue.address
                          ? `, ${event.venue.address.city}, ${event.venue.address.region}`
                          : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Ticket className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 pt-4">
              <h3 className="mb-3 text-lg font-semibold text-foreground">Your Tickets</h3>
              <div className="space-y-2 text-sm">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity} x Ticket (${(item.unitPriceCents / 100).toFixed(2)} each)
                    </span>
                    <span className="font-medium">
                      ${((item.unitPriceCents * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-border/60 pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(order.subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fees</span>
                <span>${(order.feesCents / 100).toFixed(2)}</span>
              </div>
              {order.taxCents > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${(order.taxCents / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="mt-3 flex justify-between border-t border-border/60 pt-3 text-lg font-bold">
                <span>Total</span>
                <span>${(order.totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={handleDownloadTickets}
              disabled={!isPaid}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              Download Tickets
            </button>
            <button
              type="button"
              onClick={() => toast.success('Confirmation email will be resent')}
              className="flex items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-3 font-medium text-secondary-foreground transition hover:opacity-90"
            >
              <Mail className="h-5 w-5" />
              Email Tickets
            </button>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-foreground">What&apos;s Next?</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {nextSteps.map((step) => (
                <li key={step.id} className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                  {step.id === 'dashboard' ? (
                    <span>
                      You can view and manage your tickets in your{' '}
                      <button
                        type="button"
                        onClick={() => router.push('/account/orders')}
                        className="text-primary hover:underline"
                      >
                        account dashboard
                      </button>
                      .
                    </span>
                  ) : step.id === 'support' ? (
                    <span>
                      Need help? Contact our{' '}
                      <button type="button" className="text-primary hover:underline">
                        support team
                      </button>
                      .
                    </span>
                  ) : (
                    <span>{step.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/account/orders')}
              className="rounded-full border border-border/70 px-6 py-2 text-sm font-semibold hover:bg-muted transition"
            >
              View All Orders
            </button>
            <button
              type="button"
              onClick={() => router.push('/events')}
              className="rounded-full border border-border/70 px-6 py-2 text-sm font-semibold hover:bg-muted transition"
            >
              Browse More Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
