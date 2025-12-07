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
import { useColorScheme } from '@/hooks/use-color-scheme';
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

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();

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

  const handleToggle = (key: keyof typeof preferences) => {
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
          <SettingToggle
            label="Push Notifications"
            description="Receive push notifications on your device"
            value={preferences.pushNotifications}
            onValueChange={() => handleToggle('pushNotifications')}
          />
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
});
