import { useState, useCallback } from 'react';
import { Platform, Linking, Alert, ActionSheetIOS } from 'react-native';
import type { Venue } from '@/lib/types';

type MapApp = 'apple' | 'google' | 'waze';

interface MapsOptions {
  showActionSheet?: boolean;
}

export function useMaps() {
  const [isOpening, setIsOpening] = useState(false);

  const buildAppleMapsUrl = (venue: Venue): string => {
    const { latitude, longitude, name, address, city } = venue;

    if (latitude && longitude) {
      return `maps:?daddr=${latitude},${longitude}&q=${encodeURIComponent(name)}`;
    }

    const addressQuery = [address, city].filter(Boolean).join(', ');
    return `maps:?daddr=${encodeURIComponent(addressQuery)}&q=${encodeURIComponent(name)}`;
  };

  const buildGoogleMapsUrl = (venue: Venue): string => {
    const { latitude, longitude, name, address, city } = venue;

    if (latitude && longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(name)}`;
    }

    const addressQuery = [name, address, city].filter(Boolean).join(', ');
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressQuery)}`;
  };

  const buildWazeUrl = (venue: Venue): string => {
    const { latitude, longitude, address, city } = venue;

    if (latitude && longitude) {
      return `waze://?ll=${latitude},${longitude}&navigate=yes`;
    }

    const addressQuery = [address, city].filter(Boolean).join(', ');
    return `waze://?q=${encodeURIComponent(addressQuery)}&navigate=yes`;
  };

  const openMapApp = async (url: string): Promise<boolean> => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const openDirections = useCallback(
    async (venue: Venue, options?: MapsOptions): Promise<void> => {
      if (!venue) return;

      setIsOpening(true);

      const hasCoordinates = venue.latitude && venue.longitude;
      const hasAddress = venue.address || venue.city;

      if (!hasCoordinates && !hasAddress) {
        Alert.alert('No Location', 'This venue does not have location information.');
        setIsOpening(false);
        return;
      }

      // On iOS, show action sheet to choose map app
      if (Platform.OS === 'ios' && options?.showActionSheet !== false) {
        const wazeAvailable = await Linking.canOpenURL('waze://');

        const mapOptions = ['Apple Maps', 'Google Maps'];
        if (wazeAvailable) {
          mapOptions.push('Waze');
        }
        mapOptions.push('Cancel');

        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: mapOptions,
            cancelButtonIndex: mapOptions.length - 1,
            title: 'Get Directions',
            message: `Navigate to ${venue.name}`,
          },
          async (buttonIndex) => {
            let opened = false;

            switch (buttonIndex) {
              case 0: // Apple Maps
                opened = await openMapApp(buildAppleMapsUrl(venue));
                break;
              case 1: // Google Maps
                opened = await openMapApp(buildGoogleMapsUrl(venue));
                if (!opened) {
                  // Fallback to web
                  await Linking.openURL(buildGoogleMapsUrl(venue));
                  opened = true;
                }
                break;
              case 2: // Waze (if available)
                if (wazeAvailable) {
                  opened = await openMapApp(buildWazeUrl(venue));
                }
                break;
            }

            if (!opened && buttonIndex < mapOptions.length - 1) {
              Alert.alert('Error', 'Could not open the maps application.');
            }

            setIsOpening(false);
          }
        );
      } else {
        // On Android, try Google Maps first, then fallback
        let opened = false;

        if (Platform.OS === 'android') {
          // Try Google Maps first
          opened = await openMapApp(buildGoogleMapsUrl(venue));
        } else {
          // Default to Apple Maps on iOS without action sheet
          opened = await openMapApp(buildAppleMapsUrl(venue));
        }

        if (!opened) {
          // Fallback to web Google Maps
          await Linking.openURL(buildGoogleMapsUrl(venue));
        }

        setIsOpening(false);
      }
    },
    []
  );

  const openVenueOnMap = useCallback(async (venue: Venue): Promise<void> => {
    if (!venue) return;

    const { latitude, longitude, name, address, city } = venue;
    const hasCoordinates = latitude && longitude;
    const hasAddress = address || city;

    if (!hasCoordinates && !hasAddress) {
      Alert.alert('No Location', 'This venue does not have location information.');
      return;
    }

    let url: string;

    if (Platform.OS === 'ios') {
      if (hasCoordinates) {
        url = `maps:?ll=${latitude},${longitude}&q=${encodeURIComponent(name)}`;
      } else {
        const addressQuery = [name, address, city].filter(Boolean).join(', ');
        url = `maps:?q=${encodeURIComponent(addressQuery)}`;
      }
    } else {
      if (hasCoordinates) {
        url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(name)})`;
      } else {
        const addressQuery = [name, address, city].filter(Boolean).join(', ');
        url = `geo:0,0?q=${encodeURIComponent(addressQuery)}`;
      }
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        if (hasCoordinates) {
          await Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
        } else {
          const addressQuery = [name, address, city].filter(Boolean).join(', ');
          await Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open maps.');
    }
  }, []);

  return {
    openDirections,
    openVenueOnMap,
    isOpening,
  };
}
