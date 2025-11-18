import { apiClient } from './client';

export interface SeatPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Seat {
  id: string;
  section?: string;
  row?: string;
  number?: string;
  pos?: SeatPosition;
  seatmapId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Seatmap {
  id: string;
  name: string;
  spec: any; // JSON specification for the seatmap layout
  venueId?: string;
  organizationId: string;
  totalSeats?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSeatmapDto {
  name: string;
  spec: any;
}

export interface CreateSeatDto {
  section?: string;
  row?: string;
  number?: string;
  pos?: SeatPosition;
}

export type UpdateSeatmapDto = Partial<CreateSeatmapDto>;

export const seatmapsApi = {
  /**
   * Get all seatmaps for the current user/organization
   */
  async getSeatmaps(): Promise<Seatmap[]> {
    return apiClient.get<Seatmap[]>('/seatmaps');
  },

  /**
   * Get a single seatmap by ID
   */
  async getSeatmap(id: string): Promise<Seatmap> {
    return apiClient.get<Seatmap>(`/seatmaps/${id}`);
  },

  /**
   * Create a new seatmap for an organization
   */
  async createSeatmap(orgId: string, data: CreateSeatmapDto): Promise<Seatmap> {
    return apiClient.post<Seatmap>(`/seatmaps/org/${orgId}`, data);
  },

  /**
   * Update an existing seatmap
   */
  async updateSeatmap(id: string, data: UpdateSeatmapDto): Promise<Seatmap> {
    return apiClient.patch<Seatmap>(`/seatmaps/${id}`, data);
  },

  /**
   * Delete a seatmap
   */
  async deleteSeatmap(id: string): Promise<void> {
    return apiClient.delete<void>(`/seatmaps/${id}`);
  },

  /**
   * Get all seats for a seatmap
   */
  async getSeats(seatmapId: string): Promise<Seat[]> {
    return apiClient.get<Seat[]>(`/seatmaps/${seatmapId}/seats`);
  },

  /**
   * Add seats to a seatmap
   */
  async addSeats(seatmapId: string, seats: CreateSeatDto[]): Promise<Seat[]> {
    return apiClient.post<Seat[]>(`/seatmaps/${seatmapId}/seats`, seats);
  },

  /**
   * Remove a seat from a seatmap
   */
  async removeSeat(seatId: string): Promise<void> {
    return apiClient.delete<void>(`/seatmaps/seats/${seatId}`);
  },
};
