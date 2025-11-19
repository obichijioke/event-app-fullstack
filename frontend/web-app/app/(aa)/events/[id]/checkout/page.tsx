'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { StepIndicator } from '@/components/checkout/step-indicator';
import { TicketSelector } from '@/components/checkout/ticket-selector';
import { OrderSummary } from '@/components/checkout/order-summary';
import { CountdownTimer } from '@/components/checkout/countdown-timer';
import { PublicEvent as Event } from '@/lib/events';
import { eventsApi } from '@/lib/api/events-api';
import { ticketsApi, type TicketType } from '@/lib/api/tickets-api';
import { ordersApi } from '@/lib/api/orders-api';
import { promotionsApi } from '@/lib/api/promotions-api';
import { getErrorMessage } from '@/lib/utils/error-message';
import { Calendar, MapPin, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, title: 'Select Tickets', subtitle: 'Choose your tickets' },
  { id: 2, title: 'Review & Payment', subtitle: 'Complete your purchase' },
  { id: 3, title: 'Confirmation', subtitle: 'Order confirmed' },
];

type Props = {
  params: Promise<{ id: string }>;
};

export default function CheckoutPage({ params }: Props) {
  const { id: eventId } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [ticketSelections, setTicketSelections] = useState<Map<string, number>>(new Map());
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Timer for hold expiration (10 minutes from now)
  const [holdExpiresAt] = useState(() => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
  });

  const formatEventDate = (dateString: string) => {
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

  const loadEventData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [eventData, ticketTypesData] = await Promise.all([
        eventsApi.getEvent(eventId),
        ticketsApi.getTicketTypes(eventId),
      ]);
      setEvent(eventData);
      setTicketTypes(ticketTypesData.filter((tt) => tt.status === 'active'));
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load event. Please try again.');
      console.error('Failed to load event data:', error);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const orderAmounts = useMemo(() => {
    let subtotalCents = 0;
    let feesCents = 0;

    ticketSelections.forEach((quantity, ticketTypeId) => {
      if (quantity <= 0) return;
      const ticketType = ticketTypes.find((tt) => tt.id === ticketTypeId);
      if (!ticketType) return;

      subtotalCents += Number(ticketType.priceCents) * quantity;
      feesCents += Number(ticketType.feeCents) * quantity;
    });

    return {
      subtotalCents,
      feesCents,
      totalBeforeDiscountCents: subtotalCents + feesCents,
    };
  }, [ticketSelections, ticketTypes]);

  const handleQuantityChange = (ticketTypeId: string, quantity: number) => {
    setTicketSelections((prev) => {
      const newSelections = new Map(prev);
      if (quantity === 0) {
        newSelections.delete(ticketTypeId);
      } else {
        newSelections.set(ticketTypeId, quantity);
      }
      return newSelections;
    });

    if (appliedPromoCode) {
      setPromoDiscount(0);
      setAppliedPromoCode('');
      toast('Promo code removed due to ticket selection change', { icon: 'i' });
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    if (orderAmounts.totalBeforeDiscountCents <= 0) {
      toast.error('Please select tickets before applying a promo code');
      return;
    }

    try {
      setIsValidatingPromo(true);
      const ticketTypeIds = Array.from(ticketSelections.keys());

      const result = await promotionsApi.validatePromoCode({
        code: promoCode.trim().toUpperCase(),
        eventId,
        ticketTypeIds,
        orderAmount: orderAmounts.totalBeforeDiscountCents,
      });

      const isValid = result.valid ?? result.isValid ?? false;
      const discountAmountCents =
        typeof result.discountAmount === 'number' ? result.discountAmount : 0;

      if (isValid && discountAmountCents > 0) {
        setPromoDiscount(discountAmountCents / 100);
        setAppliedPromoCode(promoCode.trim().toUpperCase());
        toast.success(`Promo code "${promoCode.toUpperCase()}" applied!`);
      } else {
        toast.error(result.message || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Failed to validate promo code:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to validate promo code';
      toast.error(message);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setAppliedPromoCode('');
    toast.success('Promo code removed');
  };

  const handleContinue = async () => {
    const selectedItems = Array.from(ticketSelections.entries())
      .filter(([, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => ({
        ticketTypeId,
        quantity,
      }));

    if (selectedItems.length === 0) {
      const message = 'Please select at least one ticket';
      toast.error(message);
      setActionError(message);
      return;
    }

    try {
      setCreatingOrder(true);
      setActionError(null);
      const order = await ordersApi.createOrder({
        eventId,
        items: selectedItems,
      });
      router.push(`/events/${eventId}/checkout/payment?orderId=${order.id}`);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to create order. Please try again.');
      console.error('Failed to create order:', error);
      setActionError(message);
      toast.error(message);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleHoldExpire = () => {
    toast.error('Your ticket reservation has expired. Please select tickets again.');
    setTicketSelections(new Map());
  };

  if (loading && !loadError) {
    return (
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading event details...</p>
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
            <h1 className="mt-2 text-2xl font-bold text-foreground">Unable to load event</h1>
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
                onClick={loadEventData}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Event not found</h1>
            <p className="mb-6 text-muted-foreground">
              The event you&apos;re looking for doesn&apos;t exist or is no longer available.
            </p>
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

  const hasSelection = Array.from(ticketSelections.values()).some((q) => q > 0);
  const suggestedCodes = ['SAVE20', 'EARLYBIRD', 'WELCOME10'];

  return (
    <div className="bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <StepIndicator currentStep={1} steps={STEPS} />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {event.coverImageUrl && (
                    <div className="relative h-20 w-32 overflow-hidden rounded-xl">
                      <Image
                        src={event.coverImageUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Select Tickets
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-foreground">{event.title}</h1>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatEventDate(event.startAt)}</span>
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {event.venue.name}
                            {event.venue.address
                              ? ` • ${event.venue.address.city}, ${event.venue.address.region}`
                              : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/events/${event.id}#seating`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
                >
                  <Eye className="h-4 w-4" />
                  View Seating
                </Link>
              </div>
            </section>

            {hasSelection && (
              <CountdownTimer expiresAt={holdExpiresAt} onExpire={handleHoldExpire} />
            )}

            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Select Tickets</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred ticket type and quantity.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {ticketTypes.length} ticket types available
                </p>
              </div>
              <div className="mt-6 space-y-4">
                {ticketTypes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-8 text-center text-muted-foreground">
                    No tickets available for this event.
                  </div>
                ) : (
                  ticketTypes.map((ticketType) => (
                    <TicketSelector
                      key={ticketType.id}
                      ticketType={ticketType}
                      quantity={ticketSelections.get(ticketType.id) || 0}
                      onQuantityChange={(quantity) =>
                        handleQuantityChange(ticketType.id, quantity)
                      }
                      soldCount={ticketType._count?.tickets || 0}
                    />
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <OrderSummary
              event={event}
              ticketSelections={ticketSelections}
              ticketTypes={ticketTypes}
              promoDiscount={promoDiscount}
              onContinue={handleContinue}
              buttonText={creatingOrder ? 'Creating Order...' : 'Continue to Details'}
              buttonDisabled={creatingOrder}
              showPromoSection
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              onApplyPromoCode={handleApplyPromoCode}
              isApplyingPromo={isValidatingPromo}
              appliedPromoCode={appliedPromoCode}
              onRemovePromoCode={handleRemovePromoCode}
              suggestedPromoCodes={suggestedCodes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
