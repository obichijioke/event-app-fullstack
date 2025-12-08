import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
} as const;

// For web platform, use localStorage as fallback
const webStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  deleteItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

// Secure storage wrapper that works on all platforms
export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return webStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (value === undefined || value === null) {
        // Skip storing invalid values to avoid SecureStore errors
        return;
      }
      const stringValue = typeof value === 'string' ? value : String(value);
      if (Platform.OS === 'web') {
        webStorage.setItem(key, stringValue);
        return;
      }
      await SecureStore.setItemAsync(key, stringValue);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        webStorage.deleteItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Storage deleteItem error:', error);
    }
  },
};

// Token storage helpers
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async setAccessToken(token: string): Promise<void> {
    return storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    return storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      storage.deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
      storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  },

  async getUser(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.USER);
  },

  async setUser(user: object): Promise<void> {
    return storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async clearUser(): Promise<void> {
    return storage.deleteItem(STORAGE_KEYS.USER);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      storage.deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
      storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
      storage.deleteItem(STORAGE_KEYS.USER),
    ]);
  },
};
