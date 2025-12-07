import apiClient from './client';
import type { Organization, Event, PaginatedResponse, Review } from '../types';

export interface OrganizerFilters {
  page?: number;
  limit?: number;
  search?: string;
  verified?: boolean;
}

export const organizersApi = {
  // Get organizer profile
  async getOrganizer(id: string): Promise<Organization> {
    const response = await apiClient.get<Organization>(`/organizations/${id}/public`);
    return response.data;
  },

  // Get organizer events
  async getOrganizerEvents(
    organizerId: string,
    filters?: { page?: number; limit?: number; upcoming?: boolean }
  ): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get<PaginatedResponse<Event>>(
      `/organizations/${organizerId}/events`,
      { params: filters }
    );
    return response.data;
  },

  // Get organizer reviews
  async getOrganizerReviews(
    organizerId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Review>> {
    const response = await apiClient.get<PaginatedResponse<Review>>(
      `/organizations/${organizerId}/reviews`,
      { params: { page, limit } }
    );
    return response.data;
  },

  // Follow organizer
  async followOrganizer(organizerId: string): Promise<void> {
    await apiClient.post(`/organizations/${organizerId}/follow`);
  },

  // Unfollow organizer
  async unfollowOrganizer(organizerId: string): Promise<void> {
    await apiClient.delete(`/organizations/${organizerId}/follow`);
  },

  // Check if following
  async isFollowing(organizerId: string): Promise<{ following: boolean }> {
    const response = await apiClient.get<{ following: boolean }>(
      `/organizations/${organizerId}/following`
    );
    return response.data;
  },

  // Get followed organizers
  async getFollowedOrganizers(
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Organization>> {
    const response = await apiClient.get<PaginatedResponse<Organization>>(
      '/account/following',
      { params: { page, limit } }
    );
    return response.data;
  },

  // Search organizers
  async searchOrganizers(filters?: OrganizerFilters): Promise<PaginatedResponse<Organization>> {
    const response = await apiClient.get<PaginatedResponse<Organization>>(
      '/organizations/search',
      { params: filters }
    );
    return response.data;
  },
};
