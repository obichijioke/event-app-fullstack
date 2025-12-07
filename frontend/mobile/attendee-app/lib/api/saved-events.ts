import apiClient from './client';
import type { Event, PaginatedResponse } from '../types';

export const savedEventsApi = {
  // Toggle save event (add/remove)
  async toggleSave(eventId: string): Promise<{ saved: boolean }> {
    const response = await apiClient.post<{ saved: boolean }>(`/saved-events/${eventId}`);
    return response.data;
  },

  // Get all saved events
  async getSavedEvents(page = 1, limit = 20): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get<PaginatedResponse<Event>>('/saved-events', {
      params: { page, limit },
    });
    return response.data;
  },

  // Get IDs of all saved events (for quick lookup)
  async getSavedEventIds(): Promise<string[]> {
    const response = await apiClient.get<{ ids: string[] }>('/saved-events/ids');
    return response.data.ids;
  },
};
