const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export interface CurrencyConfig {
  id: string;
  defaultCurrency: string;
  supportedCurrencies: string[];
  multiCurrencyEnabled: boolean;
  currencySymbol: string;
  currencyPosition: string;
  decimalPlaces: number;
  exchangeRatesEnabled: boolean;
  allowOrganizerCurrency: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  inverseRate: string;
  source: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export interface UpdateCurrencyConfigDto {
  defaultCurrency?: string;
  supportedCurrencies?: string[];
  multiCurrencyEnabled?: boolean;
  currencySymbol?: string;
  currencyPosition?: string;
  decimalPlaces?: number;
  exchangeRatesEnabled?: boolean;
  allowOrganizerCurrency?: boolean;
}

export interface AddExchangeRateDto {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source?: string;
  validFrom?: string;
  validUntil?: string;
}

class CurrencyApiService {
  private getHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getCurrencyConfig(): Promise<CurrencyConfig> {
    const response = await fetch(`${API_BASE_URL}/currency/config`);
    if (!response.ok) throw new Error('Failed to fetch currency config');
    return response.json();
  }

  async getDefaultCurrency(): Promise<{ currency: string }> {
    const response = await fetch(`${API_BASE_URL}/currency/default`);
    if (!response.ok) throw new Error('Failed to fetch default currency');
    return response.json();
  }

  async isMultiCurrencyEnabled(): Promise<{ enabled: boolean }> {
    const response = await fetch(`${API_BASE_URL}/currency/multi-currency-enabled`);
    if (!response.ok) throw new Error('Failed to check multi-currency status');
    return response.json();
  }

  async getSupportedCurrencies(): Promise<{ currencies: CurrencyInfo[]; multiCurrencyEnabled: boolean }> {
    const response = await fetch(`${API_BASE_URL}/currency/supported`);
    if (!response.ok) throw new Error('Failed to fetch supported currencies');
    return response.json();
  }

  async getAllCurrencies(): Promise<{ currencies: CurrencyInfo[] }> {
    const response = await fetch(`${API_BASE_URL}/currency/all-currencies`);
    if (!response.ok) throw new Error('Failed to fetch all currencies');
    return response.json();
  }

  async updateCurrencyConfig(token: string, dto: UpdateCurrencyConfigDto): Promise<CurrencyConfig> {
    const response = await fetch(`${API_BASE_URL}/currency/config`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      let message = 'Failed to update currency config';
      try {
        const data = await response.json();
        if (data?.message) message = data.message;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }
    return response.json();
  }

  async toggleMultiCurrency(token: string, enabled: boolean): Promise<CurrencyConfig> {
    const response = await fetch(`${API_BASE_URL}/currency/toggle-multi-currency`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) {
      let message = 'Failed to toggle multi-currency mode';
      try {
        const data = await response.json();
        if (data?.message) message = data.message;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }
    return response.json();
  }

  async getExchangeRates(): Promise<{ rates: ExchangeRate[] }> {
    const response = await fetch(`${API_BASE_URL}/currency/exchange-rates`);
    if (!response.ok) throw new Error('Failed to fetch exchange rates');
    return response.json();
  }

  async getExchangeRate(from: string, to: string): Promise<{ from: string; to: string; rate: string; formatted: string }> {
    const url = new URL(`${API_BASE_URL}/currency/exchange-rate`);
    url.searchParams.append('from', from);
    url.searchParams.append('to', to);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch exchange rate');
    return response.json();
  }

  async addExchangeRate(token: string, dto: AddExchangeRateDto): Promise<ExchangeRate> {
    const response = await fetch(`${API_BASE_URL}/currency/exchange-rates`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      let message = 'Failed to add exchange rate';
      try {
        const data = await response.json();
        if (data?.message) message = data.message;
      } catch {
        // ignore parse errors
      }
      throw new Error(message);
    }
    return response.json();
  }

  async formatAmount(amountCents: number, currency?: string): Promise<{ formatted: string; amountCents: number; currency: string }> {
    const url = new URL(`${API_BASE_URL}/currency/format`);
    url.searchParams.append('amount', amountCents.toString());
    if (currency) url.searchParams.append('currency', currency);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to format amount');
    return response.json();
  }

  async convertCurrency(amountCents: number, from: string, to: string): Promise<{
    original: { amount: number; currency: string; formatted: string };
    converted: { amount: number; currency: string; formatted: string };
  }> {
    const url = new URL(`${API_BASE_URL}/currency/convert`);
    url.searchParams.append('amount', amountCents.toString());
    url.searchParams.append('from', from);
    url.searchParams.append('to', to);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to convert currency');
    return response.json();
  }

  async getCurrencyChangeHistory(token: string, limit = 50): Promise<any[]> {
    const url = new URL(`${API_BASE_URL}/currency/history`);
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), {
      headers: this.getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch currency change history');
    return response.json();
  }
}

export const currencyApi = new CurrencyApiService();
