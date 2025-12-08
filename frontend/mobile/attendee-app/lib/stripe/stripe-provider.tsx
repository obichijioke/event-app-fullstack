// This file exists for TypeScript resolution
// The actual implementation is in stripe-provider.native.tsx and stripe-provider.web.tsx
// Metro bundler will automatically select the correct one based on platform

import React, { ReactNode } from 'react';

export interface StripeProviderProps {
  publishableKey: string;
  urlScheme?: string;
  merchantIdentifier?: string;
  children: ReactNode;
}

// Default export for type checking - actual implementation is platform-specific
export function StripeProvider(_props: StripeProviderProps): React.ReactElement {
  throw new Error('Platform-specific implementation not loaded');
}
