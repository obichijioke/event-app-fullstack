'use client';

import { useCurrency } from '@/hooks/useCurrency';

interface CurrencyDisplayProps {
  amountCents: number;
  currency?: string;
  className?: string;
  showFree?: boolean; // Show "Free" for 0 amounts
}

export function CurrencyDisplay({
  amountCents,
  currency,
  className = '',
  showFree = true,
}: CurrencyDisplayProps) {
  const { formatAmount } = useCurrency();

  if (showFree && amountCents === 0) {
    return <span className={className}>Free</span>;
  }

  return <span className={className}>{formatAmount(amountCents, currency)}</span>;
}

interface PriceRangeDisplayProps {
  minPriceCents: number;
  maxPriceCents: number;
  currency?: string;
  className?: string;
}

export function PriceRangeDisplay({
  minPriceCents,
  maxPriceCents,
  currency,
  className = '',
}: PriceRangeDisplayProps) {
  const { formatAmount } = useCurrency();

  if (minPriceCents === 0 && maxPriceCents === 0) {
    return <span className={className}>Free</span>;
  }

  if (minPriceCents === maxPriceCents) {
    return <span className={className}>{formatAmount(minPriceCents, currency)}</span>;
  }

  return (
    <span className={className}>
      {formatAmount(minPriceCents, currency)} - {formatAmount(maxPriceCents, currency)}
    </span>
  );
}
