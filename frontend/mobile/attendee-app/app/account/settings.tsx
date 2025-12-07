import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme, useThemeMode } from '@/hooks/use-color-scheme';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import type { ThemeMode } from '@/lib/stores/theme-store';
import { accountApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';

interface SettingToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function SettingToggle({ label, description, value, onValueChange, disabled }: SettingToggleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.tint }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const themeOptions: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();
  const { mode: themeMode, setMode: setThemeMode } = useThemeMode();

  const {
    hasPermission: hasPushPermission,
    requestPermission: requestPushPermission,
    isLoading: pushLoading,
    registerForPushNotifications,
    unregisterPushToken,
  } = usePushNotifications();

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    eventReminders: true,
    orderUpdates: true,
  });

  const { data: savedPreferences, isLoading } = useQuery({
    queryKey: ['account', 'preferences'],
    queryFn: accountApi.getPreferences,
  });

  useEffect(() => {
    if (savedPreferences) {
      setPreferences(savedPreferences);
    }
  }, [savedPreferences]);

  const updateMutation = useMutation({
    mutationFn: accountApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'preferences'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update preferences');
      // Revert on error
      if (savedPreferences) {
        setPreferences(savedPreferences);
      }
    },
  });

  const handleToggle = async (key: keyof typeof preferences) => {
    // Special handling for push notifications
    if (key === 'pushNotifications') {
      const newValue = !preferences[key];

      if (newValue && !hasPushPermission) {
        // Request permission when enabling
        const granted = await requestPushPermission();
        if (!granted) {
          return; // Don't update if permission wasn't granted
        }
      } else if (!newValue) {
        // Unregister token when disabling
        await unregisterPushToken();
      }

      setPreferences((prev) => ({ ...prev, [key]: newValue }));
      updateMutation.mutate({ [key]: newValue });
      return;
    }

    const newValue = !preferences[key];
    setPreferences((prev) => ({ ...prev, [key]: newValue }));
    updateMutation.mutate({ [key]: newValue });
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Preferences</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Notifications Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
        <Card padding="none" style={styles.settingsCard}>
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Receive push notifications on your device
              </Text>
              {!hasPushPermission && preferences.pushNotifications && (
                <TouchableOpacity
                  style={[styles.permissionButton, { backgroundColor: colors.tint + '15' }]}
                  onPress={requestPushPermission}
                >
                  <Ionicons name="notifications-outline" size={14} color={colors.tint} />
                  <Text style={[styles.permissionButtonText, { color: colors.tint }]}>
                    Enable permissions
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Switch
              value={preferences.pushNotifications && hasPushPermission}
              onValueChange={() => handleToggle('pushNotifications')}
              disabled={pushLoading}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#FFFFFF"
            />
          </View>
          <SettingToggle
            label="Email Notifications"
            description="Receive notifications via email"
            value={preferences.emailNotifications}
            onValueChange={() => handleToggle('emailNotifications')}
          />
          <SettingToggle
            label="SMS Notifications"
            description="Receive text message notifications"
            value={preferences.smsNotifications}
            onValueChange={() => handleToggle('smsNotifications')}
          />
        </Card>

        {/* Content Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Content Preferences</Text>
        <Card padding="none" style={styles.settingsCard}>
          <SettingToggle
            label="Event Reminders"
            description="Get reminders before events you're attending"
            value={preferences.eventReminders}
            onValueChange={() => handleToggle('eventReminders')}
          />
          <SettingToggle
            label="Order Updates"
            description="Notifications about your ticket orders"
            value={preferences.orderUpdates}
            onValueChange={() => handleToggle('orderUpdates')}
          />
          <SettingToggle
            label="Marketing Emails"
            description="Receive promotional emails and offers"
            value={preferences.marketingEmails}
            onValueChange={() => handleToggle('marketingEmails')}
          />
        </Card>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <Card padding="none" style={styles.settingsCard}>
          <View style={[styles.themeContainer, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Choose your preferred color scheme
              </Text>
            </View>
          </View>
          <View style={styles.themeOptions}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      themeMode === option.value
                        ? colors.tint + '15'
                        : colors.card,
                    borderColor:
                      themeMode === option.value
                        ? colors.tint
                        : colors.border,
                  },
                ]}
                onPress={() => setThemeMode(option.value)}
              >
                <View
                  style={[
                    styles.themeIconContainer,
                    {
                      backgroundColor:
                        themeMode === option.value
                          ? colors.tint + '25'
                          : colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={themeMode === option.value ? colors.tint : colors.icon}
                  />
                </View>
                <Text
                  style={[
                    styles.themeLabel,
                    {
                      color:
                        themeMode === option.value ? colors.tint : colors.text,
                      fontWeight: themeMode === option.value ? '600' : '500',
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {themeMode === option.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.tint}
                    style={styles.themeCheck}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.tint + '10' }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.tint} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            You can manage notification preferences for specific events from the event page.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  settingsCard: {
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  permissionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  themeOptions: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: {
    fontSize: 13,
  },
  themeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
