'use client';

import Image from 'next/image';
import { Calendar, MapPin, Shield, Lock, CreditCard, Tag } from 'lucide-react';

import type { Event } from '@/lib/api/events-api';
import type { TicketType } from '@/lib/api/tickets-api';

interface OrderSummaryProps {
  event: Event;
  ticketSelections: Map<string, number>;
  ticketTypes: TicketType[];
  promoDiscount?: number;
  onContinue?: () => void;
  buttonText?: string;
  buttonDisabled?: boolean;
  showSecurityBadges?: boolean;
  stepLabel?: string;
  showPromoSection?: boolean;
  promoCode?: string;
  onPromoCodeChange?: (value: string) => void;
  onApplyPromoCode?: () => void;
  isApplyingPromo?: boolean;
  appliedPromoCode?: string;
  onRemovePromoCode?: () => void;
  suggestedPromoCodes?: string[];
  actionErrorMessage?: string;
}

type SelectedTicket = {
  ticketType: TicketType;
  quantity: number;
  price: number;
  fee: number;
  subtotal: number;
};

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export function OrderSummary({
  event,
  ticketSelections,
  ticketTypes,
  promoDiscount = 0,
  onContinue,
  buttonText = 'Continue to Payment',
  buttonDisabled = false,
  showSecurityBadges = true,
  stepLabel = 'Step 1 of 3',
  showPromoSection = false,
  promoCode = '',
  onPromoCodeChange,
  onApplyPromoCode,
  isApplyingPromo = false,
  appliedPromoCode,
  onRemovePromoCode,
  suggestedPromoCodes = [],
  actionErrorMessage,
}: OrderSummaryProps) {
  let subtotal = 0;
  let fees = 0;

  const selectedTickets: SelectedTicket[] = Array.from(ticketSelections.entries())
    .filter(([, quantity]) => quantity > 0)
    .map(([ticketTypeId, quantity]) => {
      const ticketType = ticketTypes.find((tt) => tt.id === ticketTypeId);
      if (!ticketType) return null;

      const price = ticketType.priceCents / 100;
      const fee = ticketType.feeCents / 100;

      const itemSubtotal = price * quantity;
      const itemFees = fee * quantity;

      subtotal += itemSubtotal;
      fees += itemFees;

      return {
        ticketType,
        quantity,
        price,
        fee,
        subtotal: itemSubtotal,
      };
    })
    .filter((item): item is SelectedTicket => item !== null);

  const discount = promoDiscount;
  const total = Math.max(subtotal + fees - discount, 0);
  const promoInputValue = promoCode ?? '';

  const handlePromoInputChange = (value: string) => {
    onPromoCodeChange?.(value.toUpperCase());
  };

  return (
    <div className="sticky top-4 rounded-2xl border border-border/80 bg-card shadow-lg">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>
          {stepLabel && <span className="text-sm text-muted-foreground">{stepLabel}</span>}
        </div>

        {/* Event Info */}
        <div className="mb-6 rounded-xl border border-border/60 bg-muted/40 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {event.bannerImageUrl && (
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={event.bannerImageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
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
                </div>
              </div>
            </div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Secure Event Checkout
            </p>
          </div>
        </div>

        {/* Ticket List */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tickets
          </h4>
          {selectedTickets.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              No tickets selected yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              {selectedTickets.map((item) => (
                <div
                  key={item.ticketType.id}
                  className="flex flex-col gap-1 rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {item.ticketType.name}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {item.quantity} x {formatCurrency(item.price)}
                    </span>
                    <span>Fees {formatCurrency(item.fee * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="mb-6 space-y-2 pb-6">
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Processing Fee</span>
            <span>{formatCurrency(fees)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between text-sm text-emerald-600">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="mb-6 flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(total)}
            </p>
          </div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Secure Checkout
          </span>
        </div>

        {/* Security Badges */}
        {showSecurityBadges && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Protected</span>
            </div>
          </div>
        )}

        {/* Promo Code */}
        {showPromoSection && (
          <div className="mb-6 rounded-xl border border-dashed border-border/70 bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Tag className="h-4 w-4 text-amber-600" />
              <span>Promo Code</span>
            </div>
            {appliedPromoCode ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Code Applied: {appliedPromoCode}
                  </p>
                  <p className="text-xs text-emerald-700/80">
                    You&apos;re saving {formatCurrency(discount)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRemovePromoCode}
                  className="text-sm font-medium text-emerald-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInputValue}
                    onChange={(e) => handlePromoInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onApplyPromoCode?.();
                      }
                    }}
                    placeholder="Enter promo code"
                    className="flex-1 rounded-xl border border-border/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={onApplyPromoCode}
                    disabled={
                      isApplyingPromo || promoInputValue.trim().length === 0
                    }
                    className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isApplyingPromo ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {suggestedPromoCodes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestedPromoCodes.map((code) => (
                      <button
                        type="button"
                        key={code}
                        onClick={() => handlePromoInputChange(code)}
                        className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-500/25"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Promo codes cannot be combined. Some restrictions may apply.
                </p>
              </>
            )}
          </div>
        )}

        {/* Primary Action */}
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            disabled={buttonDisabled || selectedTickets.length === 0}
            className="w-full rounded-xl bg-primary py-3 text-base font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonText}
          </button>
        )}

        {actionErrorMessage && (
          <p className="mt-3 text-sm font-medium text-destructive">
            {actionErrorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
