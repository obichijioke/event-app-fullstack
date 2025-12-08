import React, { ReactNode } from 'react';

interface StripeProviderProps {
  publishableKey: string;
  urlScheme?: string;
  merchantIdentifier?: string;
  children: ReactNode;
}

// Web fallback - just render children without Stripe wrapper
export function StripeProvider({ children }: StripeProviderProps): React.ReactElement {
  return <>{children}</>;
}
