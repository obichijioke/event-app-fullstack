import apiClient from './client';

export interface CurrencyConfig {
  id: string;
  defaultCurrency: string;
  supportedCurrencies: string[];
  multiCurrencyEnabled: boolean;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimalPlaces: number;
  exchangeRatesEnabled: boolean;
  allowOrganizerCurrency: boolean;
  createdAt: string;
  updatedAt: string;
}

class CurrencyApi {
  async getCurrencyConfig(): Promise<CurrencyConfig> {
    const response = await apiClient.get<CurrencyConfig>('/currency/config');
    return response.data;
  }

  async getDefaultCurrency(): Promise<{ currency: string }> {
    const response = await apiClient.get<{ currency: string }>('/currency/default');
    return response.data;
  }
}

export const currencyApi = new CurrencyApi();
