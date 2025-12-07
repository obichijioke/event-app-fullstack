import apiClient from './client';
import type { Notification, PaginatedResponse } from '../types';

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unread?: boolean;
  category?: string;
}

export interface NotificationPreference {
  category: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export const notificationsApi = {
  // Get all notifications
  async getNotifications(
    filters?: NotificationFilters
  ): Promise<PaginatedResponse<Notification>> {
    const response = await apiClient.get<PaginatedResponse<Notification>>(
      '/notifications',
      { params: filters }
    );
    return response.data;
  },

  // Get unread count
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get<{ count: number }>(
      '/notifications/unread-count'
    );
    return response.data;
  },

  // Mark as read
  async markAsRead(id: string): Promise<void> {
    await apiClient.post(`/notifications/${id}/read`);
  },

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/read-all');
  },

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },

  // Bulk mark as read
  async bulkMarkAsRead(ids: string[]): Promise<void> {
    await apiClient.post('/notifications/bulk-read', { ids });
  },

  // Bulk delete
  async bulkDelete(ids: string[]): Promise<void> {
    await apiClient.post('/notifications/bulk-delete', { ids });
  },

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreference[]> {
    const response = await apiClient.get<NotificationPreference[]>(
      '/notifications/preferences'
    );
    return response.data;
  },

  // Update preference for a category
  async updatePreference(
    category: string,
    preferences: Partial<Omit<NotificationPreference, 'category'>>
  ): Promise<NotificationPreference> {
    const response = await apiClient.put<NotificationPreference>(
      `/notifications/preferences/${category}`,
      preferences
    );
    return response.data;
  },

  // Bulk update preferences
  async updatePreferences(
    preferences: NotificationPreference[]
  ): Promise<NotificationPreference[]> {
    const response = await apiClient.put<NotificationPreference[]>(
      '/notifications/preferences',
      { preferences }
    );
    return response.data;
  },

  // Get notification stats by category
  async getStats(): Promise<Record<string, { total: number; unread: number }>> {
    const response = await apiClient.get('/notifications/stats/categories');
    return response.data;
  },
};
