import apiClient from './client';
import type {
  Event,
  Category,
  HomepageData,
  PaginatedResponse,
  EventAgenda,
  EventSpeaker,
  Review,
} from '../types';

export interface EventFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  upcoming?: boolean;
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  following?: boolean;
}

export interface NearbyFilters {
  latitude?: number;
  longitude?: number;
  city?: string;
  radius?: number; // km, default 50
  page?: number;
  limit?: number;
}

export const eventsApi = {
  // Get all events with filters
  async getEvents(filters?: EventFilters): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get<PaginatedResponse<Event>>('/events', {
      params: filters,
    });
    return response.data;
  },

  // Get single event
  async getEvent(id: string): Promise<Event> {
    const response = await apiClient.get<Event>(`/events/${id}`);
    return response.data;
  },

  // Get event occurrences
  async getEventOccurrences(eventId: string): Promise<Event[]> {
    const response = await apiClient.get<Event[]>(`/events/${eventId}/occurrences`);
    return response.data;
  },

  // Get nearby events
  async getNearbyEvents(filters?: NearbyFilters): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get<PaginatedResponse<Event>>('/events/nearby', {
      params: filters,
    });
    return response.data;
  },

  // Get nearby events for authenticated user (uses stored location)
  async getNearbyEventsForMe(radius?: number): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get<PaginatedResponse<Event>>('/events/nearby/me', {
      params: { radius },
    });
    return response.data;
  },

  // Get homepage data
  async getHomepage(): Promise<HomepageData> {
    const response = await apiClient.get<HomepageData>('/homepage');
    return response.data;
  },

  // Get all categories
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },

  // Get event agenda
  async getEventAgenda(eventId: string): Promise<EventAgenda[]> {
    const response = await apiClient.get<EventAgenda[]>(`/events/${eventId}/agenda`);
    return response.data;
  },

  // Get event speakers
  async getEventSpeakers(eventId: string): Promise<EventSpeaker[]> {
    const response = await apiClient.get<EventSpeaker[]>(`/events/${eventId}/speakers`);
    return response.data;
  },

  // Get event reviews
  async getEventReviews(
    eventId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Review>> {
    const response = await apiClient.get<PaginatedResponse<Review>>(
      `/events/${eventId}/reviews`,
      { params: { page, limit } }
    );
    return response.data;
  },

  // Get event review summary
  async getEventReviewSummary(
    eventId: string
  ): Promise<{ averageRating: number; totalReviews: number; distribution: Record<number, number> }> {
    const response = await apiClient.get(`/events/${eventId}/reviews/summary`);
    return response.data;
  },

  // Get event announcements
  async getEventAnnouncements(eventId: string): Promise<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }[]> {
    const response = await apiClient.get(`/events/${eventId}/announcements`);
    return response.data;
  },

  // Get event FAQs
  async getEventFAQs(eventId: string): Promise<{
    id: string;
    question: string;
    answer: string;
    order: number;
  }[]> {
    const response = await apiClient.get(`/events/${eventId}/faqs`);
    return response.data;
  },

  // Track FAQ view
  async trackFAQView(eventId: string, faqId: string): Promise<void> {
    await apiClient.post(`/events/${eventId}/faqs/${faqId}/view`);
  },

  // Mark FAQ as helpful
  async markFAQHelpful(eventId: string, faqId: string): Promise<void> {
    await apiClient.post(`/events/${eventId}/faqs/${faqId}/helpful`);
  },
};
