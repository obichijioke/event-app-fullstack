import apiClient, { getApiError, ApiError } from './client';
import type { User, LoginRequest, RegisterRequest, Session } from '../types';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export const authApi = {
  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Register
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  // Logout all devices
  async logoutAll(): Promise<void> {
    await apiClient.post('/auth/logout-all');
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  // Update profile
  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    const response = await apiClient.patch<User>('/auth/profile', data);
    return response.data;
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Request password reset
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/password/forgot', { email });
    return response.data;
  },

  // Reset password with token
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/password/reset', {
      token,
      password,
    });
    return response.data;
  },

  // Request email verification
  async requestEmailVerification(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/email/verify/request');
    return response.data;
  },

  // Verify email with token
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/email/verify', { token });
    return response.data;
  },

  // Request 2FA code
  async request2FA(): Promise<{ qrCode: string; secret: string }> {
    const response = await apiClient.post<{ qrCode: string; secret: string }>('/auth/2fa/request');
    return response.data;
  },

  // Enable 2FA
  async enable2FA(code: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/2fa/enable', { code });
    return response.data;
  },

  // Disable 2FA
  async disable2FA(code: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/2fa/disable', { code });
    return response.data;
  },

  // Verify 2FA code during login
  async verify2FA(tempToken: string, code: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/2fa/verify', {
      tempToken,
      code,
    });
    return response.data;
  },

  // Get active sessions
  async getSessions(): Promise<Session[]> {
    const response = await apiClient.get<Session[]>('/auth/sessions');
    return response.data;
  },

  // Revoke a session
  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  // Get followed organizations
  async getFollowing(): Promise<{ organizations: { id: string; name: string; logoUrl?: string }[] }> {
    const response = await apiClient.get('/auth/me/following');
    return response.data;
  },
};

// Error type for auth operations
export type AuthError = ApiError;
export { getApiError };
