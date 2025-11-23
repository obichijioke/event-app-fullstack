'use client';

import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { StripePaymentElementOptions } from '@stripe/stripe-js';
import toast from 'react-hot-toast';

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId?: string) => void;
  onError: (error: string) => void;
  returnUrl: string;
}

export function StripePaymentForm({
  amount,
  currency,
  onSuccess,
  onError,
  returnUrl,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: 'tabs',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        // This point will only be reached if there's an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`.
        const message =
          error.type === 'card_error' || error.type === 'validation_error'
            ? error.message
            : 'An unexpected error occurred.';

        setErrorMessage(message || 'Payment failed');
        onError(message || 'Payment failed');
        toast.error(message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded - webhook will handle backend updates
        // But we also notify parent to manually confirm if needed
        onSuccess(paymentIntent.id);
      } else {
         // Fallback for redirect flow or other statuses
         onSuccess();
      }
    } catch (err) {
      const message = 'An unexpected error occurred.';
      setErrorMessage(message);
      onError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Payment Details
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Complete your purchase securely with Stripe. Your payment information is
          encrypted and secure.
        </p>

        <PaymentElement options={paymentElementOptions} />

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        <div className="mt-6 rounded-xl bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-lg font-bold text-foreground">
              {currency.toUpperCase()} {(amount / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-2xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Processing Payment...
          </span>
        ) : (
          `Pay ${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Secure Payment</span>
        </div>
        <span>•</span>
        <span>Powered by Stripe</span>
      </div>
    </form>
  );
}
