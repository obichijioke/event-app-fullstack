import { StripeProvider as NativeStripeProvider } from '@stripe/stripe-react-native';
import React, { ReactNode } from 'react';

interface StripeProviderProps {
  publishableKey: string;
  urlScheme?: string;
  merchantIdentifier?: string;
  children: ReactNode;
}

export function StripeProvider({
  publishableKey,
  urlScheme,
  merchantIdentifier,
  children,
}: StripeProviderProps): React.ReactElement {
  return (
    <NativeStripeProvider
      publishableKey={publishableKey}
      urlScheme={urlScheme}
      merchantIdentifier={merchantIdentifier}
    >
      {children as React.ReactElement}
    </NativeStripeProvider>
  );
}
