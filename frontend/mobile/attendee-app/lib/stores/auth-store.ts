import { create } from 'zustand';
import { tokenStorage } from '../utils/storage';
import { authApi, getApiError, AuthResponse } from '../api/auth';
import type { User, LoginRequest, RegisterRequest } from '../types';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  requires2FA: boolean;
  tempToken: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  verify2FA: (code: string) => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  requires2FA: false,
  tempToken: null,

  // Initialize auth state from storage
  initialize: async () => {
    try {
      set({ isLoading: true });

      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) {
        // Try to get user profile
        try {
          const user = await authApi.getProfile();
          set({
            user,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false
          });
        } catch {
          // Token invalid, clear storage
          await tokenStorage.clearAll();
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false
          });
        }
      } else {
        set({ isInitialized: true, isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isInitialized: true, isLoading: false });
    }
  },

  // Login
  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(credentials);

      // Check if 2FA is required
      if ('requires2FA' in response && (response as { requires2FA: boolean; tempToken: string }).requires2FA) {
        const twoFAResponse = response as { requires2FA: boolean; tempToken: string };
        set({
          isLoading: false,
          requires2FA: true,
          tempToken: twoFAResponse.tempToken
        });
        return true; // Indicate that 2FA is needed
      }

      // Normal login success
      await handleAuthSuccess(response);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        requires2FA: false,
        tempToken: null,
      });
      return true;
    } catch (error) {
      const apiError = getApiError(error);
      set({ isLoading: false, error: apiError.message });
      return false;
    }
  },

  // Register
  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      await handleAuthSuccess(response);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      });
      return true;
    } catch (error) {
      const apiError = getApiError(error);
      set({ isLoading: false, error: apiError.message });
      return false;
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch {
      // Ignore errors, still clear local state
    }
    await tokenStorage.clearAll();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      requires2FA: false,
      tempToken: null,
    });
  },

  // Verify 2FA
  verify2FA: async (code: string) => {
    const { tempToken } = get();
    if (!tempToken) {
      set({ error: '2FA session expired. Please login again.' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await authApi.verify2FA(tempToken, code);
      await handleAuthSuccess(response);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        requires2FA: false,
        tempToken: null,
      });
      return true;
    } catch (error) {
      const apiError = getApiError(error);
      set({ isLoading: false, error: apiError.message });
      return false;
    }
  },

  // Update user data locally
  updateUser: (userData: Partial<User>) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...userData } });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Refresh user from server
  refreshUser: async () => {
    try {
      const user = await authApi.getProfile();
      set({ user });
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },
}));

// Helper function to handle successful auth
async function handleAuthSuccess(response: AuthResponse) {
  await tokenStorage.setTokens(response.accessToken, response.refreshToken);
  await tokenStorage.setUser(response.user);
}

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
