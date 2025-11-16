'use client';

import { apiClient, ApiClient, ApiError } from '@/lib/api-client';
import { USER_STORAGE_KEY } from '@/lib/config';
import { setAccessToken } from '@/lib/auth/token-store';

export type PlatformRole = 'attendee' | 'organizer' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role: PlatformRole;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export class AuthService {
  constructor(private readonly client: ApiClient = apiClient) {}

  private persistUser(user: User) {
    if (!hasLocalStorage()) return;
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  getStoredSession() {
    if (!hasLocalStorage()) return null;

    const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      const user = JSON.parse(rawUser) as User;
      return { user };
    } catch {
      this.clearSession();
      return null;
    }
  }

  setStoredUser(user: User) {
    if (!hasLocalStorage()) return;
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  clearSession() {
    if (!hasLocalStorage()) return;
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }

  async register(data: RegisterRequest): Promise<User> {
    const user = await this.client.post<User>('/api/auth/register', data);
    return user;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/auth/login', credentials);
    this.persistUser(response.user);
    setAccessToken(response.accessToken);
    return response;
  }

  async logout(accessToken?: string) {
    try {
      if (accessToken) {
        await this.client.post('/api/auth/logout', undefined, accessToken);
      }
    } finally {
      this.clearSession();
      setAccessToken(null);
    }
  }

  async getProfile(token: string): Promise<User> {
    return this.client.get<User>('/api/auth/profile', token);
  }

  async updateProfile(data: Partial<User>, token: string): Promise<User> {
    const updatedUser = await this.client.patch<User>('/api/auth/profile', data, token);
    if (updatedUser) {
      this.setStoredUser(updatedUser);
    }
    return updatedUser;
  }

  async refreshAccessToken(): Promise<string> {
    const response = await this.client.post<{ accessToken: string }>('/api/auth/refresh');
    setAccessToken(response.accessToken);
    return response.accessToken;
  }
}

export const authService = new AuthService();
export { ApiError };
