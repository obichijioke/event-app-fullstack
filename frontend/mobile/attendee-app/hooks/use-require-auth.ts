import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';

interface UseRequireAuthOptions {
  /**
   * Message to show in the login prompt
   */
  message?: string;
  /**
   * Title for the login prompt
   */
  title?: string;
  /**
   * Route to redirect to after successful login
   */
  redirectTo?: string;
}

/**
 * Hook to require authentication for protected actions.
 * Returns a function that wraps any action with an auth check.
 * If user is not authenticated, shows a login prompt.
 *
 * Usage:
 * ```tsx
 * const requireAuth = useRequireAuth({ message: 'Login to save events' });
 *
 * const handleSave = () => {
 *   requireAuth(() => {
 *     // This only runs if user is authenticated
 *     saveEvent(eventId);
 *   });
 * };
 * ```
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { isAuthenticated } = useAuthStore();
  const {
    title = 'Login Required',
    message = 'Please log in to continue',
    redirectTo,
  } = options;

  const requireAuth = useCallback(
    <T,>(action: () => T): T | undefined => {
      if (isAuthenticated) {
        return action();
      }

      Alert.alert(title, message, [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log In',
          onPress: () => {
            router.push({
              pathname: '/(auth)/login',
              params: redirectTo ? { redirect: redirectTo } : undefined,
            });
          },
        },
      ]);

      return undefined;
    },
    [isAuthenticated, title, message, redirectTo]
  );

  return requireAuth;
}

/**
 * Hook to check if user is authenticated and redirect to login if not.
 * Unlike useRequireAuth, this immediately redirects without showing a prompt.
 * Useful for screens that absolutely require authentication.
 */
export function useAuthGuard(redirectTo?: string) {
  const { isAuthenticated } = useAuthStore();

  const checkAuth = useCallback(() => {
    if (!isAuthenticated) {
      router.replace({
        pathname: '/(auth)/login',
        params: redirectTo ? { redirect: redirectTo } : undefined,
      });
      return false;
    }
    return true;
  }, [isAuthenticated, redirectTo]);

  return { isAuthenticated, checkAuth };
}
