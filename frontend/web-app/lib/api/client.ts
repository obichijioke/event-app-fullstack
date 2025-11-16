'use client';

import { getAccessToken, setAccessToken } from '@/lib/auth/token-store';
import { buildQueryString } from '@/lib/utils/query-builder';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

type RefreshResponse = {
  accessToken?: string;
};

let refreshPromise: Promise<string | null> | null = null;

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // Backend has global prefix 'api' set in main.ts
    this.baseUrl = `${apiUrl}/api`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async getAuthToken(): Promise<string | null> {
    return getAccessToken();
  }

  private buildHeaders(overrides?: HeadersInit, token?: string) {
    const base: Record<string, string> = {
      ...this.defaultHeaders,
    };

    if (overrides) {
      if (overrides instanceof Headers) {
        overrides.forEach((value, key) => {
          base[key] = value;
        });
      } else if (Array.isArray(overrides)) {
        overrides.forEach(([key, value]) => {
          base[key] = value;
        });
      } else {
        Object.assign(base, overrides);
      }
    }

    if (token) {
      base.Authorization = `Bearer ${token}`;
    }

    return base;
  }

  private async refreshAccessToken() {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const response = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: this.defaultHeaders,
          });

          if (!response.ok) {
            let errorData: any;
            try {
              errorData = await response.json();
            } catch {
              errorData = { message: response.statusText };
            }
            throw new ApiError(
              response.status,
              errorData?.message || 'Failed to refresh session',
              errorData
            );
          }

          const data: RefreshResponse = await response.json();
          const token = data?.accessToken ?? null;
          setAccessToken(token);
          return token;
        } catch (error) {
          setAccessToken(null);
          if (error instanceof ApiError) {
            throw error;
          }
          throw new ApiError(
            0,
            error instanceof Error ? error.message : 'Network error during refresh'
          );
        } finally {
          refreshPromise = null;
        }
      })();
    }

    return refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this.getAuthToken();
    const headers = this.buildHeaders(options.headers, token ?? undefined);

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && attempt === 0) {
        await this.refreshAccessToken();
        return this.request<T>(endpoint, options, attempt + 1);
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        throw new ApiError(
          response.status,
          errorData.message || `HTTP ${response.status}`,
          errorData
        );
      }

      // Handle empty responses (like DELETE operations)
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        0,
        error instanceof Error ? error.message : 'Network error occurred'
      );
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryString = buildQueryString(params);
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.request<T>(url, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, params?: Record<string, unknown>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryString = buildQueryString(params);
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
