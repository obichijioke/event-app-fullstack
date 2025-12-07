import apiClient from './client';
import type {
  Review,
  ReviewSummary,
  CreateReviewRequest,
  UpdateReviewRequest,
  PaginatedResponse,
} from '../types';

export const reviewsApi = {
  // Event Reviews
  async createEventReview(eventId: string, data: CreateReviewRequest): Promise<Review> {
    const response = await apiClient.post<Review>(`/events/${eventId}/reviews`, data);
    return response.data;
  },

  async updateEventReview(
    eventId: string,
    reviewId: string,
    data: UpdateReviewRequest
  ): Promise<Review> {
    const response = await apiClient.patch<Review>(
      `/events/${eventId}/reviews/${reviewId}`,
      data
    );
    return response.data;
  },

  async deleteEventReview(eventId: string, reviewId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/reviews/${reviewId}`);
  },

  async getEventReviews(
    eventId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Review>> {
    const response = await apiClient.get<PaginatedResponse<Review>>(
      `/events/${eventId}/reviews`,
      { params: { page, limit } }
    );
    return response.data;
  },

  async getEventReviewSummary(eventId: string): Promise<ReviewSummary> {
    const response = await apiClient.get<ReviewSummary>(
      `/events/${eventId}/reviews/summary`
    );
    return response.data;
  },

  // Organization Reviews
  async createOrganizerReview(orgId: string, data: CreateReviewRequest): Promise<Review> {
    const response = await apiClient.post<Review>(`/organizations/${orgId}/reviews`, data);
    return response.data;
  },

  async updateOrganizerReview(
    orgId: string,
    reviewId: string,
    data: UpdateReviewRequest
  ): Promise<Review> {
    const response = await apiClient.patch<Review>(
      `/organizations/${orgId}/reviews/${reviewId}`,
      data
    );
    return response.data;
  },

  async deleteOrganizerReview(orgId: string, reviewId: string): Promise<void> {
    await apiClient.delete(`/organizations/${orgId}/reviews/${reviewId}`);
  },

  async getOrganizerReviews(
    orgId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Review>> {
    const response = await apiClient.get<PaginatedResponse<Review>>(
      `/organizations/${orgId}/reviews`,
      { params: { page, limit } }
    );
    return response.data;
  },

  async getOrganizerReviewSummary(orgId: string): Promise<ReviewSummary> {
    const response = await apiClient.get<ReviewSummary>(
      `/organizations/${orgId}/reviews/summary`
    );
    return response.data;
  },
};
