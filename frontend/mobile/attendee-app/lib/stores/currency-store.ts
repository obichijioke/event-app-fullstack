import { create } from 'zustand';
import { currencyApi, type CurrencyConfig } from '../api/currency';

interface CurrencyState {
  config: CurrencyConfig | null;
  isLoading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
}

const DEFAULT_CONFIG: CurrencyConfig = {
  id: 'default',
  defaultCurrency: 'USD',
  supportedCurrencies: ['USD'],
  multiCurrencyEnabled: false,
  currencySymbol: '$',
  currencyPosition: 'before',
  decimalPlaces: 2,
  exchangeRatesEnabled: false,
  allowOrganizerCurrency: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useCurrencyStore = create<CurrencyState>((set) => ({
  config: DEFAULT_CONFIG,
  isLoading: false,
  error: null,
  fetchConfig: async () => {
    try {
      set({ isLoading: true, error: null });
      const config = await currencyApi.getCurrencyConfig();
      set({ config, isLoading: false });
    } catch (error) {
      console.error('Failed to load currency config', error);
      set({ config: DEFAULT_CONFIG, isLoading: false, error: 'Failed to load currency config' });
    }
  },
}));

export const getCurrencySymbol = (code?: string, fallbackSymbol?: string): string => {
  if (!code) return fallbackSymbol || '$';
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    GHS: '₵',
    KES: 'KSh',
    ZAR: 'R',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
  };
  return symbols[code] || code || fallbackSymbol || '$';
};
