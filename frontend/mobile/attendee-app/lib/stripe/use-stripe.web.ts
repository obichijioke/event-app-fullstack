// Web fallback - Stripe is not supported on web
export function useStripe() {
  return {
    initPaymentSheet: async (_params: {
      paymentIntentClientSecret: string;
      merchantDisplayName: string;
      style?: 'alwaysDark' | 'alwaysLight';
      returnURL?: string;
    }) => ({ error: { message: 'Stripe is not supported on web. Please use the mobile app.' } }),
    presentPaymentSheet: async () => ({
      error: { code: 'Unavailable', message: 'Stripe is not supported on web. Please use the mobile app.' },
    }),
  };
}
