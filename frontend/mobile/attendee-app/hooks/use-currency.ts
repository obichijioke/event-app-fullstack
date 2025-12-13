import { useEffect, useMemo } from 'react';
import { useCurrencyStore, getCurrencySymbol } from '@/lib/stores/currency-store';

export function useCurrency() {
  const { config, isLoading, error, fetchConfig } = useCurrencyStore();

  useEffect(() => {
    // Load once on first use
    fetchConfig();
  }, [fetchConfig]);

  const formatAmount = (amountCents: number, currencyCode?: string) => {
    const currency = currencyCode || config?.defaultCurrency || 'USD';
    const symbol = getCurrencySymbol(currency, config?.currencySymbol);
    const decimalPlaces = config?.decimalPlaces ?? 2;
    const value = (amountCents || 0) / 100;
    const formattedValue = value.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

    const position = config?.currencyPosition || 'before';
    return position === 'before' ? `${symbol}${formattedValue}` : `${formattedValue}${symbol}`;
  };

  return useMemo(
    () => ({
      config,
      isLoading,
      error,
      formatAmount,
      defaultCurrency: config?.defaultCurrency || 'USD',
      currencySymbol: config?.currencySymbol || '$',
    }),
    [config, isLoading, error]
  );
}
