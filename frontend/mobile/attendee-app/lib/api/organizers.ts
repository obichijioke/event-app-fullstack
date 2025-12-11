import apiClient, { resolveAssetUrl } from './client';
import type { Organization, Event, PaginatedResponse, Review, FollowedOrganizer } from '../types';
import { mapEventFromApi } from './events';

export interface OrganizerFilters {
  page?: number;
  limit?: number;
  search?: string;
  verified?: boolean;
}

const mapOrganizationFromApi = (raw: any): Organization => ({
  id: raw?.id ?? '',
  name: raw?.name ?? '',
  slug: raw?.slug ?? raw?.id ?? '',
  description: raw?.description ?? undefined,
  logoUrl: resolveAssetUrl(raw?.logoUrl ?? raw?.logo_url),
  websiteUrl: raw?.website ?? raw?.websiteUrl ?? raw?.website_url ?? undefined,
  verified: raw?.verified ?? ((raw?.status === 'approved') || false),
  followerCount: raw?.followerCount ?? raw?._count?.followers ?? undefined,
  eventCount: raw?.eventCount ?? raw?._count?.events ?? undefined,
});

const normalizeEventListResponse = (
  payload: any,
  page = 1,
  limit = 20
): PaginatedResponse<Event> => {
  if (Array.isArray(payload)) {
    return {
      data: payload.map(mapEventFromApi),
      meta: {
        total: payload.length,
        page,
        limit,
        totalPages: Math.ceil(payload.length / limit) || 1,
      },
    };
  }

  const dataArray = Array.isArray(payload?.data) ? payload.data : [];
  return {
    data: dataArray.map(mapEventFromApi),
    meta: {
      total: payload?.meta?.total ?? dataArray.length,
      page: payload?.meta?.page ?? page,
      limit: payload?.meta?.limit ?? limit,
      totalPages: payload?.meta?.totalPages ?? (Math.ceil(dataArray.length / limit) || 1),
    },
  };
};

export const organizersApi = {
  // Get organizer profile (public endpoint)
  async getOrganizer(id: string): Promise<Organization> {
    const response = await apiClient.get(`/organizers/${id}`);
    return mapOrganizationFromApi(response.data);
  },

  // Get organizer events
  async getOrganizerEvents(
    organizerId: string,
    filters?: { page?: number; limit?: number; upcoming?: boolean }
  ): Promise<PaginatedResponse<Event>> {
    const response = await apiClient.get(
      `/events`,
      { params: { ...filters, organizationId: organizerId } }
    );
    return normalizeEventListResponse(response.data, filters?.page, filters?.limit);
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
    const response = await apiClient.get('/auth/me/following');
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map((item: any) => ({
      id: item?.id ?? '',
      organizationId: item?.organizationId ?? item?.organization?.id ?? '',
      organization: {
        id: item?.organization?.id ?? item?.organizationId ?? '',
        name: item?.organization?.name ?? '',
        legalName: item?.organization?.legalName,
        website: item?.organization?.website,
        country: item?.organization?.country,
        status: item?.organization?.status ?? 'pending',
        createdAt: item?.organization?.createdAt ?? new Date().toISOString(),
      },
      followedAt: item?.followedAt ?? item?.createdAt ?? new Date().toISOString(),
    }));
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
    const response = await apiClient.get('/organizers');
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(mapOrganizationFromApi);
  },
};
