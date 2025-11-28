import { apiClient } from '@/lib/api/client';
import { PublicEvent } from '@/lib/events';

export interface SavedEventsResponse {
  data: PublicEvent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const savedEventsService = {
  toggleSave: async (eventId: string): Promise<{ saved: boolean }> => {
    return apiClient.post<{ saved: boolean }>(`/saved-events/${eventId}`);
  },

  getSavedEvents: async (page = 1, limit = 20): Promise<SavedEventsResponse> => {
    return apiClient.get<SavedEventsResponse>('/saved-events', { page, limit });
  },

  getSavedEventIds: async (): Promise<string[]> => {
    return apiClient.get<string[]>('/saved-events/ids');
  },
};
