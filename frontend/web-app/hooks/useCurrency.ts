'use client';

import { useEffect, useState } from 'react';
import { currencyApi, CurrencyConfig } from '@/lib/api/currency-api';

export function useCurrency() {
  const [config, setConfig] = useState<CurrencyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await currencyApi.getCurrencyConfig();
      setConfig(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load currency config:', err);
      setError('Failed to load currency configuration');
      // Fallback to NGN if config fails to load
      setConfig({
        id: 'fallback',
        defaultCurrency: 'NGN',
        supportedCurrencies: ['NGN'],
        multiCurrencyEnabled: false,
        currencySymbol: '₦',
        currencyPosition: 'before',
        decimalPlaces: 2,
        exchangeRatesEnabled: false,
        allowOrganizerCurrency: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amountCents: number, currency?: string) => {
    if (!config) return `${(amountCents / 100).toFixed(2)}`;

    const amount = amountCents / 100;
    const formattedAmount = amount.toLocaleString(undefined, {
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
    });

    const symbol = currency ? getCurrencySymbol(currency) : config.currencySymbol;

    if (config.currencyPosition === 'before') {
      return `${symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount}${symbol}`;
    }
  };

  const getCurrencySymbol = (currencyCode: string): string => {
    const symbols: Record<string, string> = {
      NGN: '₦',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
      GHS: 'GH₵',
      KES: 'KSh',
      ZAR: 'R',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF',
      SEK: 'kr',
      NOK: 'kr',
      DKK: 'kr',
      AED: 'د.إ',
      SAR: 'ر.س',
      // Add more as needed
    };

    return symbols[currencyCode] || currencyCode;
  };

  return {
    config,
    loading,
    error,
    formatAmount,
    getCurrencySymbol,
    defaultCurrency: config?.defaultCurrency || 'NGN',
    currencySymbol: config?.currencySymbol || '₦',
    multiCurrencyEnabled: config?.multiCurrencyEnabled || false,
  };
}
