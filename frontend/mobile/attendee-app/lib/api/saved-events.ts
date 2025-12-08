import apiClient from './client';
import type { Event, PaginatedResponse } from '../types';
import { mapEventFromApi } from './events';

const normalizeMeta = (
  meta: any,
  page = 1,
  limit = 20,
  fallbackTotal = 0
): PaginatedResponse<Event>['meta'] => {
  const total = meta?.total ?? meta?.count ?? fallbackTotal ?? 0;
  const limitValue = meta?.limit ?? limit ?? fallbackTotal ?? 0;
  const pageValue = meta?.page ?? page ?? 1;
  const totalPages =
    meta?.totalPages ??
    meta?.pages ??
    (limitValue ? Math.ceil(total / limitValue) : 1);

  return {
    total,
    page: pageValue,
    limit: limitValue,
    totalPages,
  };
};

export const savedEventsApi = {
  // Toggle save event (add/remove)
  async toggleSave(eventId: string): Promise<{ saved: boolean }> {
    const response = await apiClient.post<{ saved: boolean }>(`/saved-events/${eventId}`);
    return response.data;
  },

  // Get all saved events
  async getSavedEvents(page = 1, limit = 20): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get('/saved-events', {
      params: { page, limit },
    });
    const payload = response.data;
    const events = Array.isArray(payload?.data)
      ? payload.data.map(mapEventFromApi)
      : [];

    return {
      data: events,
      meta: normalizeMeta(payload?.meta, page, limit, events.length),
    };
  },

  // Get IDs of all saved events (for quick lookup)
  async getSavedEventIds(): Promise<string[]> {
    const response = await apiClient.get<{ ids?: string[] }>('/saved-events/ids');
    return Array.isArray(response.data?.ids) ? response.data.ids : [];
  },
};
