'use client';

import { CreditCard, Smartphone } from 'lucide-react';
import type { PaymentProviderStatus } from '@/lib/api/orders-api';

export type PaymentProviderType = 'stripe' | 'paystack';

interface PaymentProvider {
  id: PaymentProviderType;
  name: string;
  description: string;
  icon: typeof CreditCard;
  available: boolean;
  reason?: string | null;
  logo?: string;
}

interface PaymentProviderSelectorProps {
  selectedProvider: PaymentProviderType;
  onProviderChange: (provider: PaymentProviderType) => void;
  stripeAvailable: boolean;
  paystackAvailable: boolean;
  providerStatuses?: PaymentProviderStatus[];
}

export function PaymentProviderSelector({
  selectedProvider,
  onProviderChange,
  stripeAvailable,
  paystackAvailable,
  providerStatuses,
}: PaymentProviderSelectorProps) {
  const statusMap =
    providerStatuses?.reduce<Record<string, PaymentProviderStatus>>((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {}) || {};

  const providers: PaymentProvider[] = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, Amex, and more',
      icon: CreditCard,
      available: stripeAvailable && (statusMap.stripe?.available ?? true),
      reason: statusMap.stripe?.reason || (!stripeAvailable ? 'Unavailable' : null),
    },
    {
      id: 'paystack',
      name: 'Paystack',
      description: 'Card, Bank Transfer, USSD, Mobile Money',
      icon: Smartphone,
      available: paystackAvailable && (statusMap.paystack?.available ?? true),
      reason:
        statusMap.paystack?.reason || (!paystackAvailable ? 'Unavailable' : null),
    },
  ];

  const availableProviders = providers.filter((p) => p.available);
  const unavailableProviders = providers.filter((p) => !p.available);

  if (availableProviders.length === 0) {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 space-y-3">
        <div>
          <p className="text-sm font-semibold text-destructive">
            No payment providers configured
          </p>
          <p className="mt-1 text-xs text-destructive/80">
            Please contact support to complete your purchase.
          </p>
        </div>
        {unavailableProviders.length > 0 && (
          <div className="space-y-2">
            {unavailableProviders.map((provider) => (
              <div key={provider.id} className="text-xs text-destructive/90">
                <span className="font-semibold">{provider.name}:</span>{' '}
                {provider.reason || 'Unavailable'}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // If only one provider is available, auto-select it
  if (
    availableProviders.length === 1 &&
    selectedProvider !== availableProviders[0].id
  ) {
    onProviderChange(availableProviders[0].id);
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground">Payment Method</h2>
      <p className="text-sm text-muted-foreground">
        Choose how you&apos;d like to complete your purchase.
      </p>

      <div className="mt-4 space-y-3">
        {availableProviders.map((provider) => (
          <label
            key={provider.id}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
              selectedProvider === provider.id
                ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                : 'border-border/70 hover:bg-muted/50'
            }`}
          >
            <input
              type="radio"
              name="paymentProvider"
              value={provider.id}
              checked={selectedProvider === provider.id}
              onChange={(e) =>
                onProviderChange(e.target.value as PaymentProviderType)
              }
              className="h-4 w-4 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
            />
            <provider.icon
              className={`h-5 w-5 ${
                selectedProvider === provider.id
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            />
            <div className="flex-1">
              <p
                className={`font-medium ${
                  selectedProvider === provider.id
                    ? 'text-foreground'
                    : 'text-foreground/90'
                }`}
              >
                {provider.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {provider.description}
              </p>
            </div>
            {selectedProvider === provider.id && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                <svg
                  className="h-4 w-4 text-primary-foreground"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </label>
        ))}
      </div>

      {availableProviders.length === 1 && (
        <div className="mt-4 rounded-xl border border-border/50 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            {availableProviders[0].name} is the only available payment method for this
            transaction.
          </p>
        </div>
      )}

      {unavailableProviders.length > 0 && (
        <div className="mt-4 space-y-1">
          {unavailableProviders.map((provider) => (
            <p key={provider.id} className="text-xs text-muted-foreground">
              {provider.name}: {provider.reason || 'Unavailable'}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
