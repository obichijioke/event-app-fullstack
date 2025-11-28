'use client';

import { useMemo, useState } from 'react';
import { Minus, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { TicketType } from '@/lib/api/tickets-api';

interface TicketSelectorProps {
  ticketType: TicketType;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  soldCount?: number;
}

export function TicketSelector({
  ticketType,
  quantity,
  onQuantityChange,
  soldCount = 0,
}: TicketSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const priceCents = Number(ticketType.priceCents);
  const feeCents = Number(ticketType.feeCents);
  const totalCents = priceCents + feeCents;

  const holdsCount = ticketType._count?.holds || 0;
  const soldOrIssued = soldCount || ticketType._count?.tickets || 0;
  const hasCapacity = typeof ticketType.capacity === 'number';
  const rawAvailable =
    hasCapacity && typeof ticketType.capacity === 'number'
      ? Math.max(0, (ticketType.capacity as number) - soldOrIssued - holdsCount)
      : null;
  const maxPerOrder = ticketType.perOrderLimit || 10;
  const maxQuantity =
    rawAvailable === null ? maxPerOrder : Math.min(rawAvailable, maxPerOrder);

  const handleDecrease = () => {
    if (quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  // Check if ticket is currently on sale
  const now = new Date();
  const isBeforeSale = ticketType.salesStart && new Date(ticketType.salesStart) > now;
  const isAfterSale = ticketType.salesEnd && new Date(ticketType.salesEnd) < now;
  const isOnSale = !isBeforeSale && !isAfterSale;

  // Determine badge text
  const statusBadge = useMemo(() => {
    if (isBeforeSale) {
      return {
        text: 'Coming Soon',
        className: 'bg-muted text-muted-foreground',
      };
    }

    if (rawAvailable !== null && rawAvailable <= 0) {
      return {
        text: 'Sold Out',
        className: 'bg-destructive/10 text-destructive',
      };
    }

    if (rawAvailable !== null && rawAvailable <= 10) {
      return {
        text: `Only ${rawAvailable} left`,
        className: 'bg-warning/20 text-warning-foreground',
      };
    }

    return null;
  }, [isBeforeSale, rawAvailable]);

  const marketingBadge =
    ticketType.kind === 'GA'
      ? { text: 'Popular', className: 'bg-amber-500/20 text-amber-700' }
      : null;

  const hasDetails =
    !!ticketType.description ||
    !!ticketType.priceTiers?.length ||
    !!ticketType.salesStart ||
    !!ticketType.salesEnd ||
    !!ticketType.perOrderLimit ||
    feeCents > 0;

  const compareAtPriceCents =
    ticketType.priceTiers?.reduce(
      (highest, tier) => Math.max(highest, tier.priceCents),
      0,
    ) ?? 0;
  const compareAtPrice =
    compareAtPriceCents > ticketType.priceCents ? compareAtPriceCents : undefined;

  const availabilityText =
    rawAvailable === null
      ? 'Tickets available'
      : `${rawAvailable} available`;

  return (
    <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm hover:border-primary/40">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-foreground">{ticketType.name}</h3>
            {marketingBadge && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${marketingBadge.className}`}>
                {marketingBadge.text}
              </span>
            )}
            {statusBadge && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}>
                {statusBadge.text}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">
              <CurrencyDisplay
                amountCents={totalCents}
                currency={ticketType.currency}
                showFree
              />
            </span>
            {compareAtPrice && (
              <span className="text-base text-muted-foreground line-through">
                <CurrencyDisplay
                  amountCents={compareAtPrice}
                  currency={ticketType.currency}
                  showFree={false}
                />
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium text-emerald-600">{availabilityText}</span>
            {ticketType.priceTiers && ticketType.priceTiers.length > 0 && (
              <span className="text-primary">Early Bird</span>
            )}
            {ticketType.perOrderLimit && (
              <span className="text-muted-foreground">
                Limit {ticketType.perOrderLimit} per order
              </span>
            )}
          </div>

          {ticketType.description && (
            <p className="mt-3 text-sm text-muted-foreground">
              {ticketType.description}
            </p>
          )}

          {hasDetails && (
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              More info
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="self-center rounded-lg border border-border/70 px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={quantity === 0 || !isOnSale}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-xl font-semibold text-foreground">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrease}
              disabled={quantity >= maxQuantity || !isOnSale}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Fees{' '}
            <CurrencyDisplay
              amountCents={feeCents}
              currency={ticketType.currency}
              showFree={false}
            />{' '}
            included in total
          </p>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && hasDetails && (
        <div className="mt-5 space-y-4 rounded-lg border border-dashed border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
          {ticketType.description && (
            <p className="text-foreground">{ticketType.description}</p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sales window</p>
              <p className="text-foreground">
                {ticketType.salesStart
                  ? new Date(ticketType.salesStart).toLocaleDateString()
                  : 'Now'}{' '}
                -{' '}
                {ticketType.salesEnd
                  ? new Date(ticketType.salesEnd).toLocaleDateString()
                  : 'Event day'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Per order limit</p>
              <p className="text-foreground">
                {ticketType.perOrderLimit ? ticketType.perOrderLimit : '10'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Fees</p>
              <p className="text-foreground">
                <CurrencyDisplay
                  amountCents={feeCents}
                  currency={ticketType.currency}
                  showFree={false}
                />{' '}
                per ticket
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Type</p>
              <p className="text-foreground">{ticketType.kind === 'SEATED' ? 'Reserved seating' : 'General admission'}</p>
            </div>
          </div>
          {ticketType.priceTiers && ticketType.priceTiers.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Price tiers</p>
              <ul className="space-y-1">
                {ticketType.priceTiers.map((tier) => (
                  <li key={tier.id} className="flex justify-between text-foreground">
                    <span>
                      {(tier.startsAt
                        ? new Date(tier.startsAt).toLocaleDateString()
                        : 'From day one')}
                      {tier.endsAt && ` - ${new Date(tier.endsAt).toLocaleDateString()}`}
                    </span>
                    <span>
                      <CurrencyDisplay
                        amountCents={Number(tier.priceCents)}
                        currency={ticketType.currency}
                        showFree={false}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
