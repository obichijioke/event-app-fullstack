import apiClient from './client';
import type { UserLocation, City, PaginatedResponse } from '../types';

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  source: 'browser' | 'manual';
}

export interface CitySearchParams {
  search?: string;
  country?: string;
  limit?: number;
}

export const locationApi = {
  // Get user's stored location
  async getLocation(): Promise<UserLocation | null> {
    try {
      const response = await apiClient.get<UserLocation>('/account/location');
      return response.data;
    } catch (error: unknown) {
      // 404 means no location stored yet
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  // Update user's location
  async updateLocation(data: UpdateLocationRequest): Promise<UserLocation> {
    const response = await apiClient.put<UserLocation>('/account/location', data);
    return response.data;
  },

  // Delete user's stored location
  async deleteLocation(): Promise<void> {
    await apiClient.delete('/account/location');
  },

  // Search cities
  async searchCities(params?: CitySearchParams): Promise<City[]> {
    const response = await apiClient.get<City[]>('/cities', { params });
    return response.data;
  },

  // Get popular cities (for initial display)
  async getPopularCities(): Promise<City[]> {
    const response = await apiClient.get<City[]>('/cities/popular');
    return response.data;
  },

  // Get city by ID
  async getCity(id: string): Promise<City> {
    const response = await apiClient.get<City>(`/cities/${id}`);
    return response.data;
  },

  // Get nearby cities based on coordinates
  async getNearbyCities(latitude: number, longitude: number, limit = 10): Promise<City[]> {
    const response = await apiClient.get<City[]>('/cities/nearby', {
      params: { latitude, longitude, limit },
    });
    return response.data;
  },
};
