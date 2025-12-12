import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { tokenStorage } from '../utils/storage';

// API base URL - update this to match your backend
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Generate User-Agent string with device information
const getUserAgent = (): string => {
  const appName = Constants.expoConfig?.name || 'EventFlow';
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const platform = Platform.OS;
  const osVersion = Platform.Version;
  const deviceModel = Device.modelName || Device.deviceName || 'Unknown';
  const isExpoGo = Constants.appOwnership === 'expo';

  // Format: EventFlow/1.0.0 (iOS 17.0; iPhone 15 Pro) Expo Go
  const parts = [
    `${appName}/${appVersion}`,
    `(${platform === 'ios' ? 'iOS' : 'Android'} ${osVersion}; ${deviceModel})`,
  ];

  if (isExpoGo) {
    parts.push('Expo Go');
  }

  return parts.join(' ');
};

// Normalize origin (strip paths like /api) for assets that may be returned as relative or localhost URLs
export const API_BASE_ORIGIN = (() => {
  try {
    const url = new URL(API_BASE_URL);
    return url.origin;
  } catch {
    // Fallback: best-effort remove trailing /api to get host:port
    return API_BASE_URL.replace(/\/api\/?$/, '');
  }
})();

// Ensure image/file URLs are absolute and reachable from devices
export const resolveAssetUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const url = `${value}`.trim();
  if (!url) return undefined;

  // Absolute URL
  if (/^https?:\/\//i.test(url)) {
    // Replace localhost with the API host so physical devices can load images
    if (/https?:\/\/localhost/i.test(url)) {
      return url.replace(/https?:\/\/localhost(?::\d+)?/i, API_BASE_ORIGIN);
    }
    return url;
  }

  // Protocol-relative URL
  if (url.startsWith('//')) {
    const protocol = API_BASE_ORIGIN.startsWith('https') ? 'https:' : 'http:';
    return `${protocol}${url}`;
  }

  // Relative path
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  // Avoid duplicating /api when asset paths already include it
  const cleanedPath = normalizedPath.replace(/^\/api(\/|$)/, '/');
  return `${API_BASE_ORIGIN}${cleanedPath}`;
};

// Callback to reset auth state - set by auth store to avoid circular dependency
let onAuthReset: (() => void) | null = null;

export const setAuthResetCallback = (callback: () => void) => {
  onAuthReset = callback;
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': getUserAgent(),
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}[] = [];

const subscribeTokenRefresh = (
  resolve: (token: string) => void,
  reject: (error: Error) => void
) => {
  refreshSubscribers.push({ resolve, reject });
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
};

const onTokenRefreshFailed = (error: Error) => {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
};

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            (error: Error) => {
              reject(error);
            }
          );
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Store new tokens
        await tokenStorage.setTokens(accessToken, newRefreshToken);

        // Update the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Notify all subscribers
        onTokenRefreshed(accessToken);

        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        // Clear tokens
        await tokenStorage.clearAll();
        // Reject all pending requests
        const authError = new Error('Authentication failed. Please login again.');
        onTokenRefreshFailed(authError);
        // Reset auth state to trigger navigation to login
        if (onAuthReset) {
          onAuthReset();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper function for API errors
export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export const getApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
    return {
      message: axiosError.response?.data?.message || axiosError.message || 'An error occurred',
      statusCode: axiosError.response?.status,
      errors: axiosError.response?.data?.errors,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'An unexpected error occurred' };
};
