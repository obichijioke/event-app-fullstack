'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /**
   * Value in cents
   */
  value: number;
  /**
   * Callback when value changes (receives value in cents)
   */
  onChange: (cents: number) => void;
  /**
   * Currency code (e.g., 'USD', 'NGN', 'EUR')
   * If not provided, uses the system default currency
   */
  currency?: string;
  /**
   * Allow negative values (default: false)
   */
  allowNegative?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Currency input component that displays dollar/currency amounts but stores values in cents.
 * Integrates with the existing useCurrency hook to support multi-currency and proper formatting.
 * Provides a better UX by showing users familiar currency format while maintaining
 * backend compatibility with cent-based storage.
 *
 * @example
 * // For a $12.50 value (stored as 1250 cents)
 * <CurrencyInput
 *   value={1250}
 *   onChange={(cents) => setFormData({ ...formData, priceCents: cents })}
 *   currency="USD"
 *   placeholder="0.00"
 * />
 *
 * @example
 * // For a ₦5,000 value (stored as 500000 cents/kobo)
 * <CurrencyInput
 *   value={500000}
 *   onChange={(cents) => setFormData({ ...formData, priceCents: cents })}
 *   currency="NGN"
 *   placeholder="0.00"
 * />
 */
export function CurrencyInput({
  value,
  onChange,
  currency,
  allowNegative = false,
  className,
  placeholder = '0.00',
  ...props
}: CurrencyInputProps) {
  const { getCurrencySymbol, config } = useCurrency();

  // Use provided currency or fall back to system default
  const currencyCode = currency || config?.defaultCurrency || 'USD';
  const currencySymbol = getCurrencySymbol(currencyCode);
  const decimalPlaces = config?.decimalPlaces ?? 2;
  const currencyPosition = config?.currencyPosition || 'before';

  // Convert cents to currency amount for display
  const displayValue = React.useMemo(() => {
    const amount = value / 100;
    return amount.toFixed(decimalPlaces);
  }, [value, decimalPlaces]);

  const [inputValue, setInputValue] = React.useState(displayValue);
  const [isFocused, setIsFocused] = React.useState(false);

  // Update input value when prop value changes (external update)
  React.useEffect(() => {
    if (!isFocused) {
      setInputValue(displayValue);
    }
  }, [displayValue, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Remove currency symbols and any non-numeric characters except . and -
    input = input.replace(/[^0-9.-]/g, '');

    // Handle negative values
    if (!allowNegative && input.startsWith('-')) {
      input = input.substring(1);
    }

    // Validate decimal places
    const parts = input.split('.');
    if (parts.length > 2) {
      // Multiple decimal points, ignore
      return;
    }
    if (parts[1] && parts[1].length > decimalPlaces) {
      // Too many decimal places, truncate
      input = `${parts[0]}.${parts[1].substring(0, decimalPlaces)}`;
    }

    setInputValue(input);

    // Convert to cents
    const amount = parseFloat(input) || 0;
    const cents = Math.round(amount * 100);

    onChange(cents);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the display value on blur
    const amount = value / 100;
    setInputValue(amount.toFixed(decimalPlaces));
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className="relative">
      {currencyPosition === 'before' && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {currencySymbol}
        </span>
      )}
      <input
        {...props}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={cn(
          'w-full py-2 border rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          currencyPosition === 'before' ? 'pl-8 pr-3' : 'pl-3 pr-8',
          className
        )}
      />
      {currencyPosition === 'after' && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {currencySymbol}
        </span>
      )}
    </div>
  );
}
