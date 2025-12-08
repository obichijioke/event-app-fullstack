// This file exists for TypeScript resolution
// The actual implementation is in use-stripe.native.ts and use-stripe.web.ts
// Metro bundler will automatically select the correct one based on platform

export interface PaymentSheetParams {
  paymentIntentClientSecret: string;
  merchantDisplayName: string;
  style?: 'alwaysDark' | 'alwaysLight';
  returnURL?: string;
}

export interface PaymentSheetError {
  code?: string;
  message: string;
}

export interface UseStripeReturn {
  initPaymentSheet: (params: PaymentSheetParams) => Promise<{ error?: PaymentSheetError }>;
  presentPaymentSheet: () => Promise<{ error?: PaymentSheetError }>;
}

// Default export for type checking - actual implementation is platform-specific
export function useStripe(): UseStripeReturn {
  throw new Error('Platform-specific implementation not loaded');
}
