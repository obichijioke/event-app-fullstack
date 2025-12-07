import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Loading } from '@/components/ui/loading';
import { Colors } from '@/constants/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

function RootLayoutNav() {
  const colorScheme = useColorScheme() ?? 'light';
  const segments = useSegments();
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();

  // Initialize auth state
  useEffect(() => {
    initialize();
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

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not on auth screens
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated and on auth screens
      router.replace('/(tabs)');
    }
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
        <Stack.Screen name="disputes" />
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
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
