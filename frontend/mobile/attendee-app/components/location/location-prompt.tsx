import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocation } from '@/hooks/use-location';
import { useLocationStore } from '@/lib/stores/location-store';
import { CityPicker } from './city-picker';
import type { City } from '@/lib/types';

interface LocationPromptProps {
  onLocationSet?: () => void;
}

export function LocationPrompt({ onLocationSet }: LocationPromptProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { updateLocationFromGPS, isLoading: gpsLoading } = useLocation();
  const { updateLocationFromCity, setHasPromptedForLocation, userLocation } = useLocationStore();

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Don't show if user already has a location
  if (userLocation) {
    return null;
  }

  const handleUseCurrentLocation = async () => {
    setIsUpdating(true);
    try {
      const success = await updateLocationFromGPS();
      if (success) {
        setHasPromptedForLocation(true);
        onLocationSet?.();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectCity = async (city: City) => {
    setIsUpdating(true);
    try {
      await updateLocationFromCity(city);
      setHasPromptedForLocation(true);
      onLocationSet?.();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setHasPromptedForLocation(true);
  };

  const isLoading = gpsLoading || isUpdating;

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.tint + '10', borderColor: colors.tint + '30' },
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={[styles.iconBg, { backgroundColor: colors.tint + '20' }]}>
            <Ionicons name="location" size={24} color={colors.tint} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Find events near you
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enable location to discover events happening in your area
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.tint }]}
              onPress={handleUseCurrentLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Use Current Location</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                { borderColor: colors.tint },
              ]}
              onPress={() => setShowCityPicker(true)}
              disabled={isLoading}
            >
              <Ionicons name="search" size={16} color={colors.tint} />
              <Text style={[styles.secondaryButtonText, { color: colors.tint }]}>
                Choose City
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <CityPicker
        visible={showCityPicker}
        onClose={() => setShowCityPicker(false)}
        onSelect={handleSelectCity}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconContainer: {
    marginTop: 2,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
});
