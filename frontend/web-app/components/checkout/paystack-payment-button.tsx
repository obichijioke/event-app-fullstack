'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import toast from 'react-hot-toast';

interface PaystackPaymentButtonProps {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  publicKey: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

// Extend window to include PaystackPop
declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: any) => {
        openIframe: () => void;
      };
    };
  }
}

export function PaystackPaymentButton({
  email,
  amount,
  currency,
  reference,
  publicKey,
  onSuccess,
  onClose,
}: PaystackPaymentButtonProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handlePayment = () => {
    if (!window.PaystackPop) {
      toast.error('Paystack is not loaded. Please refresh and try again.');
      return;
    }

    setProcessing(true);

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email,
      amount, // in kobo (smallest currency unit)
      currency: currency.toUpperCase(),
      ref: reference,
      onClose: () => {
        setProcessing(false);
        onClose();
        toast.error('Payment cancelled');
      },
      callback: (response: any) => {
        setProcessing(false);
        if (response.status === 'success') {
          onSuccess(response.reference);
          toast.success('Payment successful!');
        } else {
          toast.error('Payment failed. Please try again.');
        }
      },
    });

    handler.openIframe();
  };

  return (
    <>
      <Script
        src="https://js.paystack.co/v1/inline.js"
        onLoad={() => setScriptLoaded(true)}
        onError={() => {
          toast.error('Failed to load Paystack. Please refresh the page.');
        }}
      />

      <div className="space-y-6">
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Payment with Paystack
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Pay securely using Paystack. Multiple payment methods available including
            cards, bank transfers, and mobile money.
          </p>

          <div className="space-y-4 rounded-xl bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reference</span>
              <span className="font-mono text-xs text-foreground">
                {reference.substring(0, 20)}...
              </span>
            </div>
            <div className="border-t border-border/50 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-lg font-bold text-foreground">
                  {currency.toUpperCase()} {(amount / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 rounded-xl border border-border/50 bg-muted/30 p-4">
            <h3 className="font-semibold text-foreground">Available Payment Methods:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Credit/Debit Card (Visa, Mastercard, Verve)
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Bank Transfer
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                USSD
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Mobile Money
              </li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePayment}
          disabled={!scriptLoaded || processing}
          className="w-full rounded-2xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Opening Paystack...
            </span>
          ) : !scriptLoaded ? (
            'Loading Paystack...'
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
          <span>Powered by Paystack</span>
        </div>
      </div>
    </>
  );
}
