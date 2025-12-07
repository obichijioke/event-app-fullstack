import apiClient from './client';
import type { User, Session, TicketTransfer, PaginatedResponse } from '../types';

export interface TransferFilters {
  type?: 'sent' | 'received' | 'all';
  status?: 'pending' | 'accepted' | 'canceled';
  page?: number;
  limit?: number;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  eventReminders: boolean;
  orderUpdates: boolean;
}

export const accountApi = {
  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/account/profile');
    return response.data;
  },

  // Update profile
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put<User>('/account/profile', data);
    return response.data;
  },

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.put('/account/password', data);
  },

  // Get sessions
  async getSessions(): Promise<Session[]> {
    const response = await apiClient.get<Session[]>('/account/sessions');
    return response.data;
  },

  // Revoke session
  async revokeSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/account/sessions/${sessionId}`);
  },

  // Revoke all other sessions
  async revokeAllSessions(): Promise<void> {
    await apiClient.delete('/account/sessions');
  },

  // Get preferences
  async getPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get<UserPreferences>('/account/preferences');
    return response.data;
  },

  // Update preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await apiClient.put<UserPreferences>(
      '/account/preferences',
      preferences
    );
    return response.data;
  },

  // Request account deletion
  async requestAccountDeletion(password: string): Promise<void> {
    await apiClient.post('/account/delete', { password });
  },

  // Upload avatar
  async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
    const response = await apiClient.post<{ avatarUrl: string }>(
      '/account/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Delete avatar
  async deleteAvatar(): Promise<void> {
    await apiClient.delete('/account/avatar');
  },

  // Enable 2FA
  async enable2FA(): Promise<{ secret: string; qrCode: string }> {
    const response = await apiClient.post<{ secret: string; qrCode: string }>(
      '/account/2fa/enable'
    );
    return response.data;
  },

  // Confirm 2FA
  async confirm2FA(code: string): Promise<{ backupCodes: string[] }> {
    const response = await apiClient.post<{ backupCodes: string[] }>(
      '/account/2fa/confirm',
      { code }
    );
    return response.data;
  },

  // Disable 2FA
  async disable2FA(code: string): Promise<void> {
    await apiClient.post('/account/2fa/disable', { code });
  },

  // Get ticket transfers
  async getTransfers(filters?: TransferFilters): Promise<PaginatedResponse<TicketTransfer>> {
    const response = await apiClient.get<PaginatedResponse<TicketTransfer>>(
      '/account/transfers',
      { params: filters }
    );
    return response.data;
  },

  // Get pending incoming transfers count
  async getPendingTransfersCount(): Promise<number> {
    const response = await accountApi.getTransfers({
      type: 'received',
      status: 'pending',
      limit: 1,
    });
    return response.meta.total;
  },

  // Register push notification token
  async registerPushToken(data: {
    token: string;
    platform: string;
    deviceType?: string;
  }): Promise<void> {
    await apiClient.post('/account/push-tokens', data);
  },

  // Unregister push notification token
  async unregisterPushToken(token: string): Promise<void> {
    await apiClient.delete('/account/push-tokens', { data: { token } });
  },

  // Get user's registered push tokens
  async getPushTokens(): Promise<{ id: string; token: string; platform: string; createdAt: string }[]> {
    const response = await apiClient.get<{ id: string; token: string; platform: string; createdAt: string }[]>(
      '/account/push-tokens'
    );
    return response.data;
  },
};
