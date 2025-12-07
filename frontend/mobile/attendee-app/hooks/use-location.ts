import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import { useLocationStore, LocationPermissionStatus } from '@/lib/stores/location-store';

interface UseLocationOptions {
  autoRequest?: boolean;
  showDeniedAlert?: boolean;
}

interface UseLocationReturn {
  // State
  permissionStatus: LocationPermissionStatus;
  isLoading: boolean;
  error: string | null;
  currentCoords: { latitude: number; longitude: number } | null;

  // Actions
  requestPermission: () => Promise<boolean>;
  getCurrentPosition: () => Promise<{ latitude: number; longitude: number } | null>;
  updateLocationFromGPS: () => Promise<boolean>;
  openSettings: () => void;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const { autoRequest = false, showDeniedAlert = true } = options;

  const {
    permissionStatus,
    setPermissionStatus,
    currentCoords,
    setCurrentCoords,
    updateLocationFromGPS: storeUpdateFromGPS,
  } = useLocationStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check current permission status
  const checkPermissionStatus = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      let mappedStatus: LocationPermissionStatus;
      switch (status) {
        case Location.PermissionStatus.GRANTED:
          mappedStatus = 'granted';
          break;
        case Location.PermissionStatus.DENIED:
          mappedStatus = 'denied';
          break;
        case Location.PermissionStatus.UNDETERMINED:
        default:
          mappedStatus = 'undetermined';
          break;
      }

      setPermissionStatus(mappedStatus);
      return mappedStatus;
    } catch (err) {
      console.error('Failed to check location permission:', err);
      return 'undetermined';
    }
  }, [setPermissionStatus]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      let mappedStatus: LocationPermissionStatus;
      let granted = false;

      switch (status) {
        case Location.PermissionStatus.GRANTED:
          mappedStatus = 'granted';
          granted = true;
          break;
        case Location.PermissionStatus.DENIED:
          mappedStatus = 'denied';
          if (showDeniedAlert) {
            Alert.alert(
              'Location Permission Denied',
              'To see events near you, please enable location access in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => openSettings() },
              ]
            );
          }
          break;
        default:
          mappedStatus = 'undetermined';
          break;
      }

      setPermissionStatus(mappedStatus);
      return granted;
    } catch (err) {
      console.error('Failed to request location permission:', err);
      setError('Failed to request location permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setPermissionStatus, showDeniedAlert]);

  // Get current position
  const getCurrentPosition = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check permission first
      const status = await checkPermissionStatus();
      if (status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          return null;
        }
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentCoords(coords);
      return coords;
    } catch (err) {
      console.error('Failed to get current position:', err);
      setError('Failed to get current location');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissionStatus, requestPermission, setCurrentCoords]);

  // Update location in store from GPS
  const updateLocationFromGPS = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const coords = await getCurrentPosition();
      if (!coords) {
        return false;
      }

      await storeUpdateFromGPS(coords);
      return true;
    } catch (err) {
      console.error('Failed to update location from GPS:', err);
      setError('Failed to update location');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentPosition, storeUpdateFromGPS]);

  // Open app settings
  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  // Auto-request permission if enabled
  useEffect(() => {
    if (autoRequest) {
      checkPermissionStatus();
    }
  }, [autoRequest, checkPermissionStatus]);

  return {
    permissionStatus,
    isLoading,
    error,
    currentCoords,
    requestPermission,
    getCurrentPosition,
    updateLocationFromGPS,
    openSettings,
  };
}

// Hook for watching location changes (for real-time tracking if needed)
export function useLocationWatch(enabled = false) {
  const { setCurrentCoords } = useLocationStore();
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 100, // Or every 100 meters
          },
          (location) => {
            setCurrentCoords({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
        setIsWatching(true);
      } catch (err) {
        console.error('Failed to start location watch:', err);
      }
    };

    if (enabled) {
      startWatching();
    }

    return () => {
      if (subscription) {
        subscription.remove();
        setIsWatching(false);
      }
    };
  }, [enabled, setCurrentCoords]);

  return { isWatching };
}
