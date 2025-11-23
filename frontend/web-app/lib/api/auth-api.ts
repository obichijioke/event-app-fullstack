import { ApiClient } from './client';

const apiClient = new ApiClient();

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  role: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddr: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export interface FollowingOrganization {
  id: string;
  orgId: string;
  userId: string;
  followedAt: string;
  org: {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    _count?: {
      events: number;
    };
  };
}

export const authApi = {
  requestPasswordReset: (email: string) =>
    apiClient.post<{ message: string }>('/auth/password/forgot', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/password/reset', {
      token,
      newPassword,
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    }),

  requestEmailVerification: (email: string) =>
    apiClient.post<{ message: string }>('/auth/email/verify/request', { email }),

  verifyEmail: (token: string) =>
    apiClient.post<{ message: string }>('/auth/email/verify', { token }),

  requestTwoFactorCode: (purpose: 'enable' | 'disable' = 'enable') =>
    apiClient.post<{ message: string }>('/auth/2fa/request', { purpose }),

  enableTwoFactor: (code: string) =>
    apiClient.post<{ message: string }>('/auth/2fa/enable', { code }),

  disableTwoFactor: (code: string) =>
    apiClient.post<{ message: string }>('/auth/2fa/disable', { code }),

  getProfile: () =>
    apiClient.get<UserProfile>('/auth/profile'),

  updateProfile: (data: {
    name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
  }) =>
    apiClient.patch<UserProfile>('/auth/profile', data),

  getSessions: () =>
    apiClient.get<Session[]>('/auth/sessions'),

  revokeSession: (sessionId: string) =>
    apiClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`),

  logoutAll: () =>
    apiClient.post<{ message: string }>('/auth/logout-all', {}),

  getApiKeys: () =>
    apiClient.get<ApiKey[]>('/auth/api-keys'),

  createApiKey: (name: string) =>
    apiClient.post<{ id: string; name: string; key: string; message: string }>(
      '/auth/api-keys',
      { name }
    ),

  revokeApiKey: (id: string) =>
    apiClient.delete<{ message: string }>(`/auth/api-keys/${id}`),

  getFollowing: () =>
    apiClient.get<FollowingOrganization[]>('/auth/me/following'),

  // Avatar management
  uploadAvatar: (file: File) =>
    apiClient.upload<{ message: string; avatarUrl: string }>('/account/avatar', file),

  deleteAvatar: () =>
    apiClient.delete<{ message: string }>('/account/avatar'),

  getAvatarUrl: () =>
    apiClient.get<{ avatarUrl: string | null }>('/account/avatar'),
};
