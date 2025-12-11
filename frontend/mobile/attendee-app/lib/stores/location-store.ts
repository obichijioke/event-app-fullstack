import { create } from 'zustand';
import { locationApi } from '../api/location';
import { tokenStorage } from '../utils/storage';
import type { UserLocation, City } from '../types';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied' | 'restricted';

interface LocationState {
  // State
  userLocation: UserLocation | null;
  currentCoords: { latitude: number; longitude: number } | null;
  selectedCity: City | null;
  permissionStatus: LocationPermissionStatus;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  hasPromptedForLocation: boolean;

  // Actions
  initialize: () => Promise<void>;
  setPermissionStatus: (status: LocationPermissionStatus) => void;
  setCurrentCoords: (coords: { latitude: number; longitude: number } | null) => void;
  updateLocationFromGPS: (coords: { latitude: number; longitude: number }) => Promise<void>;
  updateLocationFromCity: (city: City) => Promise<void>;
  deleteLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  setHasPromptedForLocation: (value: boolean) => void;
  clearError: () => void;
  reset: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  // Initial state
  userLocation: null,
  currentCoords: null,
  selectedCity: null,
  permissionStatus: 'undetermined',
  isLoading: false,
  isInitialized: false,
  error: null,
  hasPromptedForLocation: false,

  // Initialize - fetch stored location from server
  initialize: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    try {
      set({ isLoading: true });
      const accessToken = await tokenStorage.getAccessToken();
      // Skip remote fetch for guests
      if (!accessToken) {
        set({
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      const location = await locationApi.getLocation();

      set({
        userLocation: location,
        currentCoords: location ? { latitude: location.latitude, longitude: location.longitude } : null,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize location:', error);
      set({
        isInitialized: true,
        isLoading: false,
        error: 'Failed to load location',
      });
    }
  },

  // Set permission status
  setPermissionStatus: (status: LocationPermissionStatus) => {
    set({ permissionStatus: status });
  },

  // Set current coordinates (from GPS)
  setCurrentCoords: (coords: { latitude: number; longitude: number } | null) => {
    set({ currentCoords: coords });
  },

  // Update location using GPS coordinates
  updateLocationFromGPS: async (coords: { latitude: number; longitude: number }) => {
    set({ isLoading: true, error: null });
    try {
      const accessToken = await tokenStorage.getAccessToken();

      // If not authenticated, store locally without hitting the API
      if (!accessToken) {
        const now = new Date().toISOString();
        const guestLocation: UserLocation = {
          id: 'guest-location',
          latitude: coords.latitude,
          longitude: coords.longitude,
          source: 'browser',
          createdAt: now,
          updatedAt: now,
        };

        set({
          userLocation: guestLocation,
          currentCoords: coords,
          isLoading: false,
          selectedCity: null,
        });
        return;
      }

      const location = await locationApi.updateLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        source: 'browser', // Using 'browser' as source for GPS/device location
      });

      set({
        userLocation: location,
        currentCoords: coords,
        isLoading: false,
        selectedCity: null, // Clear selected city since we're using GPS
      });
    } catch (error) {
      console.error('Failed to update location from GPS:', error);
      set({
        isLoading: false,
        error: 'Failed to update location',
      });
      throw error;
    }
  },

  // Update location from selected city
  updateLocationFromCity: async (city: City) => {
    set({ isLoading: true, error: null });
    try {
      const accessToken = await tokenStorage.getAccessToken();

      // Guest mode: store locally only
      if (!accessToken) {
        const now = new Date().toISOString();
        const guestLocation: UserLocation = {
          id: 'guest-location',
          latitude: city.latitude,
          longitude: city.longitude,
          city: city.name,
          country: city.country,
          source: 'manual',
          createdAt: now,
          updatedAt: now,
        };

        set({
          userLocation: guestLocation,
          currentCoords: { latitude: city.latitude, longitude: city.longitude },
          selectedCity: city,
          isLoading: false,
        });
        return;
      }

      const location = await locationApi.updateLocation({
        latitude: city.latitude,
        longitude: city.longitude,
        city: city.name,
        country: city.country,
        source: 'manual',
      });

      set({
        userLocation: location,
        currentCoords: { latitude: city.latitude, longitude: city.longitude },
        selectedCity: city,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to update location from city:', error);
      set({
        isLoading: false,
        error: 'Failed to update location',
      });
      throw error;
    }
  },

  // Delete stored location
  deleteLocation: async () => {
    set({ isLoading: true, error: null });
    try {
      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) {
        await locationApi.deleteLocation();
      }
      set({
        userLocation: null,
        currentCoords: null,
        selectedCity: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to delete location:', error);
      set({
        isLoading: false,
        error: 'Failed to delete location',
      });
      throw error;
    }
  },

  // Refresh location from server
  refreshLocation: async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) return;

      const location = await locationApi.getLocation();
      set({
        userLocation: location,
        currentCoords: location ? { latitude: location.latitude, longitude: location.longitude } : null,
      });
    } catch (error) {
      console.error('Failed to refresh location:', error);
    }
  },

  // Track if user has been prompted for location
  setHasPromptedForLocation: (value: boolean) => {
    set({ hasPromptedForLocation: value });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store (on logout)
  reset: () => {
    set({
      userLocation: null,
      currentCoords: null,
      selectedCity: null,
      permissionStatus: 'undetermined',
      isLoading: false,
      isInitialized: false,
      error: null,
      hasPromptedForLocation: false,
    });
  },
}));

// Selector hooks
export const useUserLocation = () => useLocationStore((state) => state.userLocation);
export const useCurrentCoords = () => useLocationStore((state) => state.currentCoords);
export const useLocationPermission = () => useLocationStore((state) => state.permissionStatus);
export const useLocationLoading = () => useLocationStore((state) => state.isLoading);
export const useHasLocation = () => useLocationStore((state) => state.userLocation !== null);
