import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocation } from '@/hooks/use-location';
import { useLocationStore } from '@/lib/stores/location-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CityPicker } from '@/components/location';
import type { City } from '@/lib/types';

export default function LocationScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    userLocation,
    selectedCity,
    updateLocationFromCity,
    deleteLocation,
    isLoading: storeLoading,
  } = useLocationStore();

  const {
    permissionStatus,
    updateLocationFromGPS,
    requestPermission,
    openSettings,
    isLoading: gpsLoading,
  } = useLocation();

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isLoading = storeLoading || gpsLoading || isUpdating;

  const handleUseCurrentLocation = async () => {
    setIsUpdating(true);
    try {
      const success = await updateLocationFromGPS();
      if (success) {
        Alert.alert('Success', 'Location updated to your current position');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectCity = async (city: City) => {
    setIsUpdating(true);
    try {
      await updateLocationFromCity(city);
      Alert.alert('Success', `Location set to ${city.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearLocation = () => {
    Alert.alert(
      'Clear Location',
      'Are you sure you want to remove your location? You won\'t receive personalized nearby event recommendations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLocation();
              Alert.alert('Success', 'Location cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear location');
            }
          },
        },
      ]
    );
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'restricted':
        return 'Restricted';
      default:
        return 'Not Requested';
    }
  };

  const getPermissionStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return colors.success;
      case 'denied':
      case 'restricted':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Location</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Location */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Location</Text>
        <Card style={styles.section}>
          {userLocation ? (
            <View style={styles.locationDisplay}>
              <View style={[styles.locationIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="location" size={24} color={colors.success} />
              </View>
              <View style={styles.locationInfo}>
                {userLocation.city ? (
                  <>
                    <Text style={[styles.locationCity, { color: colors.text }]}>
                      {userLocation.city}
                    </Text>
                    <Text style={[styles.locationCountry, { color: colors.textSecondary }]}>
                      {userLocation.country || 'Unknown Country'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.locationCity, { color: colors.text }]}>
                      Custom Location
                    </Text>
                    <Text style={[styles.locationCountry, { color: colors.textSecondary }]}>
                      {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </Text>
                  </>
                )}
                <Text style={[styles.locationSource, { color: colors.textSecondary }]}>
                  Source: {userLocation.source === 'browser' ? 'GPS' : userLocation.source}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noLocation}>
              <View style={[styles.locationIcon, { backgroundColor: colors.tint + '15' }]}>
                <Ionicons name="location-outline" size={24} color={colors.tint} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationCity, { color: colors.text }]}>
                  No location set
                </Text>
                <Text style={[styles.locationCountry, { color: colors.textSecondary }]}>
                  Set your location to see nearby events
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Location Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Update Location</Text>
        <Card style={styles.section}>
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: colors.border }]}
            onPress={handleUseCurrentLocation}
            disabled={isLoading}
          >
            <View style={styles.actionInfo}>
              <Ionicons name="navigate-outline" size={24} color={colors.tint} />
              <View style={styles.actionText}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  Use Current Location
                </Text>
                <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
                  Detect your location using GPS
                </Text>
              </View>
            </View>
            {gpsLoading ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setShowCityPicker(true)}
            disabled={isLoading}
          >
            <View style={styles.actionInfo}>
              <Ionicons name="search-outline" size={24} color={colors.tint} />
              <View style={styles.actionText}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  Choose a City
                </Text>
                <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
                  Select from our list of cities
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Location Permission */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Permission Status</Text>
        <Card style={styles.section}>
          <View style={styles.permissionRow}>
            <View style={styles.permissionInfo}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.icon} />
              <View style={styles.permissionText}>
                <Text style={[styles.permissionLabel, { color: colors.text }]}>
                  Location Access
                </Text>
                <Text style={[styles.permissionStatus, { color: getPermissionStatusColor() }]}>
                  {getPermissionStatusText()}
                </Text>
              </View>
            </View>
            {permissionStatus === 'denied' && (
              <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: colors.tint }]}
                onPress={openSettings}
              >
                <Text style={styles.settingsButtonText}>Settings</Text>
              </TouchableOpacity>
            )}
            {permissionStatus === 'undetermined' && (
              <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: colors.tint }]}
                onPress={requestPermission}
              >
                <Text style={styles.settingsButtonText}>Request</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Clear Location */}
        {userLocation && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Manage
            </Text>
            <Card style={styles.section}>
              <TouchableOpacity
                style={styles.dangerRow}
                onPress={handleClearLocation}
                disabled={isLoading}
              >
                <View style={styles.actionInfo}>
                  <Ionicons name="trash-outline" size={24} color={colors.error} />
                  <View style={styles.actionText}>
                    <Text style={[styles.actionLabel, { color: colors.error }]}>
                      Clear Location
                    </Text>
                    <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
                      Remove your stored location
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.error} />
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            Your location is used to show you relevant nearby events. It is not shared with other
            users or third parties.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CityPicker
        visible={showCityPicker}
        onClose={() => setShowCityPicker(false)}
        onSelect={handleSelectCity}
        selectedCity={selectedCity}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  noLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationCity: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationCountry: {
    fontSize: 14,
  },
  locationSource: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionHint: {
    fontSize: 13,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  permissionText: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  permissionStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  settingsButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
