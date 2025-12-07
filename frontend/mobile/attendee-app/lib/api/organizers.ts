import apiClient from './client';
import type { Organization, Event, PaginatedResponse, Review, FollowedOrganizer } from '../types';

export interface OrganizerFilters {
  page?: number;
  limit?: number;
  search?: string;
  verified?: boolean;
}

export const organizersApi = {
  // Get organizer profile (public endpoint)
  async getOrganizer(id: string): Promise<Organization> {
    const response = await apiClient.get<Organization>(`/organizers/${id}`);
    return response.data;
  },

  // Get organizer events
  async getOrganizerEvents(
    organizerId: string,
    filters?: { page?: number; limit?: number; upcoming?: boolean }
  ): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get<PaginatedResponse<Event>>(
      `/events`,
      { params: { ...filters, organizationId: organizerId } }
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

  // Get organizer review summary
  async getOrganizerReviewSummary(organizerId: string): Promise<{ averageRating: number; reviewCount: number }> {
    const response = await apiClient.get<{ averageRating: number; reviewCount: number }>(
      `/organizations/${organizerId}/reviews/summary`
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

  // Get followed organizers (uses auth endpoint)
  async getFollowedOrganizers(): Promise<FollowedOrganizer[]> {
    const response = await apiClient.get<FollowedOrganizer[]>('/auth/me/following');
    return response.data;
  },

  // Check if following an organizer (uses followed list)
  async isFollowing(organizerId: string): Promise<{ following: boolean }> {
    try {
      const following = await organizersApi.getFollowedOrganizers();
      const isFollowed = following.some((f) => f.organizationId === organizerId);
      return { following: isFollowed };
    } catch {
      return { following: false };
    }
  },

  // Get all public organizers
  async getAllOrganizers(): Promise<Organization[]> {
    const response = await apiClient.get<Organization[]>('/organizers');
    return response.data;
  },
};
