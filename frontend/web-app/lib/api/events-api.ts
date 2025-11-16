import { apiClient } from './client';

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  timezone: string;
  status: 'draft' | 'pending' | 'approved' | 'live' | 'paused' | 'ended' | 'canceled';
  visibility: 'public' | 'unlisted' | 'private';
  categoryId?: string;
  organizationId: string;
  venueId?: string;
  venue?: Venue;
  organization?: Organization;
  bannerImageUrl?: string;
  thumbnailUrl?: string;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };
  timezone: string;
  capacity?: number;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
}

export interface OrganizerEventSummary {
  id: string;
  title: string;
  status: string;
  startAt: string;
  visibility: 'public' | 'unlisted' | 'private';
}

export const eventsApi = {
  async getEvent(id: string): Promise<Event> {
    return apiClient.get<Event>(`/events/${id}`);
  },

  async getPublicEvents(params?: {
    status?: string;
    categoryId?: string;
    upcoming?: boolean;
    search?: string;
  }): Promise<Event[]> {
    return apiClient.get<Event[]>('/events', params);
  },

  async getOrganizerEvents(params?: {
    orgId?: string;
    status?: string;
    search?: string;
    upcoming?: boolean;
  }): Promise<OrganizerEventSummary[]> {
    return apiClient.get<OrganizerEventSummary[]>('/events/my', params);
  },
};
