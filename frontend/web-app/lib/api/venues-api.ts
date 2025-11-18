import { apiClient } from './client';

export interface VenueAddress {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal: string;
  country: string;
}

export interface Venue {
  id: string;
  name: string;
  address: VenueAddress;
  timezone: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVenueDto {
  name: string;
  address: VenueAddress;
  timezone: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
}

export type UpdateVenueDto = Partial<CreateVenueDto>;

export const venuesApi = {
  /**
   * Get all venues for the current user/organization
   */
  async getVenues(): Promise<Venue[]> {
    return apiClient.get<Venue[]>('/venues');
  },

  /**
   * Get a single venue by ID
   */
  async getVenue(id: string): Promise<Venue> {
    return apiClient.get<Venue>(`/venues/${id}`);
  },

  /**
   * Create a new venue
   */
  async createVenue(data: CreateVenueDto): Promise<Venue> {
    return apiClient.post<Venue>('/venues', data);
  },

  /**
   * Create a new venue for a specific organization
   */
  async createVenueForOrg(orgId: string, data: CreateVenueDto): Promise<Venue> {
    return apiClient.post<Venue>(`/venues/org/${orgId}`, data);
  },

  /**
   * Update an existing venue
   */
  async updateVenue(id: string, data: UpdateVenueDto): Promise<Venue> {
    return apiClient.patch<Venue>(`/venues/${id}`, data);
  },

  /**
   * Delete a venue
   */
  async deleteVenue(id: string): Promise<void> {
    return apiClient.delete<void>(`/venues/${id}`);
  },
};
