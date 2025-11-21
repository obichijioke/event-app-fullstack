'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth';
import { currencyApi, CurrencyConfig, CurrencyInfo, ExchangeRate } from '@/lib/api/currency-api';
import toast from 'react-hot-toast';

export default function CurrencySettingsForm() {
  const { accessToken, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<CurrencyConfig | null>(null);
  const [allCurrencies, setAllCurrencies] = useState<CurrencyInfo[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);

  // Form state
  const [defaultCurrency, setDefaultCurrency] = useState('NGN');
  const [multiCurrencyEnabled, setMultiCurrencyEnabled] = useState(false);
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['NGN']);
  const [currencyPosition, setCurrencyPosition] = useState('before');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [exchangeRatesEnabled, setExchangeRatesEnabled] = useState(false);
  const [allowOrganizerCurrency, setAllowOrganizerCurrency] = useState(false);

  // Exchange rate form
  const [showAddRate, setShowAddRate] = useState(false);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [rate, setRate] = useState('');

  useEffect(() => {
    loadCurrencyData();
  }, []);

  const loadCurrencyData = async () => {
    try {
      setLoading(true);

      // Load config and currencies - these should always work
      const [configData, currenciesData] = await Promise.all([
        currencyApi.getCurrencyConfig(),
        currencyApi.getAllCurrencies(),
      ]);

      setConfig(configData);
      setAllCurrencies(currenciesData.currencies);

      // Try to load exchange rates, but don't fail if it errors (database drift issue)
      try {
        const ratesData = await currencyApi.getExchangeRates();
        setExchangeRates(ratesData.rates);
      } catch (ratesError) {
        console.warn('Exchange rates not available (database schema issue):', ratesError);
        setExchangeRates([]);
        // Don't show error to user - exchange rates are optional
      }

      // Set form values from config
      setDefaultCurrency(configData.defaultCurrency);
      setMultiCurrencyEnabled(configData.multiCurrencyEnabled);
      setSupportedCurrencies(configData.supportedCurrencies);
      setCurrencyPosition(configData.currencyPosition);
      setDecimalPlaces(configData.decimalPlaces);
      setExchangeRatesEnabled(configData.exchangeRatesEnabled);
      setAllowOrganizerCurrency(configData.allowOrganizerCurrency);
    } catch (error) {
      console.error('Failed to load currency data:', error);
      toast.error('Failed to load currency settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (user?.role !== 'admin') {
      toast.error('You need admin access to update currency settings.');
      return;
    }
    if (!accessToken) {
      toast.error('You must be logged in');
      return;
    }

    try {
      setSaving(true);
      await currencyApi.updateCurrencyConfig(accessToken, {
        defaultCurrency,
        supportedCurrencies,
        multiCurrencyEnabled,
        currencyPosition,
        decimalPlaces,
        exchangeRatesEnabled,
        allowOrganizerCurrency,
      });
      toast.success('Currency settings updated successfully!');
      await loadCurrencyData();
    } catch (error: any) {
      console.error('Failed to update currency settings:', error);
      toast.error(error?.message || 'Failed to update currency settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMultiCurrency = async () => {
    if (user?.role !== 'admin') {
      toast.error('You need admin access to update currency settings.');
      return;
    }
    if (!accessToken) {
      toast.error('You must be logged in');
      return;
    }

    try {
      const newValue = !multiCurrencyEnabled;
      await currencyApi.toggleMultiCurrency(accessToken, newValue);
      setMultiCurrencyEnabled(newValue);
      toast.success(`Multi-currency mode ${newValue ? 'enabled' : 'disabled'}!`);
      await loadCurrencyData();
    } catch (error: any) {
      console.error('Failed to toggle multi-currency:', error);
      toast.error(error?.message || 'Failed to toggle multi-currency mode');
    }
  };

  const handleAddExchangeRate = async () => {
    if (user?.role !== 'admin') {
      toast.error('You need admin access to update currency settings.');
      return;
    }
    if (!accessToken) {
      toast.error('You must be logged in');
      return;
    }

    if (!rate || parseFloat(rate) <= 0) {
      toast.error('Please enter a valid exchange rate');
      return;
    }

    try {
      await currencyApi.addExchangeRate(accessToken, {
        fromCurrency,
        toCurrency,
        rate: parseFloat(rate),
        source: 'manual',
      });
      toast.success(`Exchange rate added: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
      setShowAddRate(false);
      setRate('');
      await loadCurrencyData();
    } catch (error: any) {
      console.error('Failed to add exchange rate:', error);
      toast.error(error?.message || 'Failed to add exchange rate');
    }
  };

  const handleToggleSupportedCurrency = (currencyCode: string) => {
    if (currencyCode === defaultCurrency) {
      toast.error('Cannot remove the default currency from supported currencies');
      return;
    }

    setSupportedCurrencies((prev) => {
      if (prev.includes(currencyCode)) {
        return prev.filter((c) => c !== currencyCode);
      } else {
        return [...prev, currencyCode];
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading currency settings...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        You need admin access to view or update currency settings.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Multi-Currency Mode Toggle */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">Multi-Currency Mode</h2>
            <p className="text-sm text-muted-foreground">
              {multiCurrencyEnabled
                ? 'Allow events and tickets to use different currencies'
                : 'All events and tickets must use the default currency'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleMultiCurrency}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
              multiCurrencyEnabled ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                multiCurrencyEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Default Currency */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Default Currency</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {allCurrencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              This currency will be used by default for all events and tickets
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Symbol Position</label>
            <select
              value={currencyPosition}
              onChange={(e) => setCurrencyPosition(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="before">Before amount (₦1,000)</option>
              <option value="after">After amount (1,000₦)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Decimal Places</label>
            <input
              type="number"
              min="0"
              max="4"
              value={decimalPlaces}
              onChange={(e) => setDecimalPlaces(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Number of decimal places to display
            </p>
          </div>
        </div>
      </div>

      {/* Supported Currencies */}
      {multiCurrencyEnabled && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Supported Currencies</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select which currencies organizers can use for their events
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allCurrencies.map((currency) => (
              <label
                key={currency.code}
                className={`flex items-center gap-2 p-3 rounded-md border cursor-pointer transition ${
                  supportedCurrencies.includes(currency.code)
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                } ${currency.code === defaultCurrency ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={supportedCurrencies.includes(currency.code)}
                  onChange={() => handleToggleSupportedCurrency(currency.code)}
                  disabled={currency.code === defaultCurrency}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{currency.code}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {currency.symbol}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Options */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Advanced Options</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Exchange Rates</label>
              <p className="text-xs text-muted-foreground">
                Enable automatic currency conversion using exchange rates
              </p>
            </div>
            <input
              type="checkbox"
              checked={exchangeRatesEnabled}
              onChange={(e) => setExchangeRatesEnabled(e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Allow Organizer Currency</label>
              <p className="text-xs text-muted-foreground">
                Let organizers choose their own currency for events
              </p>
            </div>
            <input
              type="checkbox"
              checked={allowOrganizerCurrency}
              onChange={(e) => setAllowOrganizerCurrency(e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Exchange Rates */}
      {exchangeRatesEnabled && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Exchange Rates</h2>
            <button
              type="button"
              onClick={() => setShowAddRate(!showAddRate)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
            >
              {showAddRate ? 'Cancel' : 'Add Rate'}
            </button>
          </div>

          {showAddRate && (
            <div className="mb-6 p-4 border border-border rounded-md bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">From Currency</label>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {supportedCurrencies.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">To Currency</label>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {supportedCurrencies.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Exchange Rate</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="0.000000"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddExchangeRate}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
                >
                  Add Exchange Rate
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {exchangeRates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No exchange rates configured. Add your first rate above.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exchangeRates.map((rate) => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between p-3 border border-border rounded-md"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        1 {rate.fromCurrency} = {parseFloat(rate.rate).toFixed(6)} {rate.toCurrency}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Source: {rate.source} • {rate.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={loadCurrencyData}
          className="px-6 py-2 border border-border rounded-md hover:bg-secondary transition"
          disabled={saving}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
