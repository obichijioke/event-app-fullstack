'use client';

import { useCurrency } from '@/hooks/useCurrency';

interface CurrencyDisplayProps {
  amountCents: number | bigint; // Support both number and bigint
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

  // Convert bigint to number for comparison if needed
  const isZero = typeof amountCents === 'bigint'
    ? amountCents === BigInt(0)
    : amountCents === 0;

  if (showFree && isZero) {
    return <span className={className}>Free</span>;
  }

  // Convert bigint to number for formatAmount compatibility
  const numericAmount = typeof amountCents === 'bigint'
    ? Number(amountCents)
    : amountCents;

  return <span className={className}>{formatAmount(numericAmount, currency)}</span>;
}

interface PriceRangeDisplayProps {
  minPriceCents: number | bigint; // Support both number and bigint
  maxPriceCents: number | bigint; // Support both number and bigint
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

  // Convert to numbers for comparison
  const minValue = typeof minPriceCents === 'bigint'
    ? Number(minPriceCents)
    : minPriceCents;
  const maxValue = typeof maxPriceCents === 'bigint'
    ? Number(maxPriceCents)
    : maxPriceCents;

  if (minValue === 0 && maxValue === 0) {
    return <span className={className}>Free</span>;
  }

  // Convert bigint to number for formatAmount compatibility
  const numericMin = typeof minPriceCents === 'bigint'
    ? Number(minPriceCents)
    : minPriceCents;
  const numericMax = typeof maxPriceCents === 'bigint'
    ? Number(maxPriceCents)
    : maxPriceCents;

  if (minValue === maxValue) {
    return <span className={className}>{formatAmount(numericMin, currency)}</span>;
  }

  return (
    <span className={className}>
      {formatAmount(numericMin, currency)} - {formatAmount(numericMax, currency)}
    </span>
  );
}
