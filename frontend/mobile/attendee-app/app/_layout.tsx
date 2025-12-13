import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Loading } from '@/components/ui/loading';
import { Colors } from '@/constants/theme';
import { useCurrencyStore } from '@/lib/stores/currency-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@/lib/stripe';

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Custom theme to match our design
const createCustomTheme = (isDark: boolean) => {
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const colors = Colors[isDark ? 'dark' : 'light'];

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.tint,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };
};

// Screens that require authentication
const PROTECTED_ROUTES = [
  'tickets',      // My tickets - requires login
  'orders',       // My orders - requires login
  'notifications',// Notifications - requires login
  'account',      // Account settings - requires login
  'disputes',     // Disputes - requires login
];

// Screens that are always public (no login required)
// - (tabs) - Home, Search, Explore are public
// - events - Event browsing and details are public
// - organizers - Organizer profiles are public

function RootLayoutNav() {
  const colorScheme = useColorScheme() ?? 'light';
  const segments = useSegments();
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const fetchCurrencyConfig = useCurrencyStore((state) => state.fetchConfig);

  // Initialize auth state
  useEffect(() => {
    initialize();
    fetchCurrencyConfig();
  }, []);

  // Hide splash screen when initialized
  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  // Handle auth-based navigation
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentRoute = segments[0] as string;
    const isProtectedRoute = PROTECTED_ROUTES.includes(currentRoute);
    const atRoot = !segments || segments.length === 0;
    const inTabs = currentRoute === '(tabs)';

    // If user is on a protected route and not authenticated, redirect to login
    if (!isAuthenticated && isProtectedRoute) {
      // Store the intended destination for redirect after login
      router.replace({
        pathname: '/(auth)/login',
        params: { redirect: `/${segments.join('/')}` },
      });
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated and on auth screens
      router.replace('/(tabs)');
    } else if (!isAuthenticated && !inAuthGroup && !isProtectedRoute && (atRoot || !inTabs)) {
      // Default unauthenticated entry point goes to tabs/home instead of login
      router.replace('/(tabs)');
    }
    // Otherwise, allow navigation (public routes accessible without auth)
  }, [isAuthenticated, isInitialized, segments]);

  // Show loading while initializing
  if (!isInitialized) {
    return <Loading fullScreen message="Loading..." />;
  }

  return (
    <ThemeProvider value={createCustomTheme(colorScheme === 'dark')}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="events" />
        <Stack.Screen name="tickets" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="account" />
        <Stack.Screen name="organizers" />
        <Stack.Screen name="disputes/index" />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      urlScheme="eventflow"
      merchantIdentifier="merchant.com.eventflow.app"
    >
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </StripeProvider>
  );
}
