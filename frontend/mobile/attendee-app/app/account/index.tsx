import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/auth-store';
import { notificationsApi } from '@/lib/api';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: number;
  showArrow?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, badge, showArrow = true, danger }: MenuItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: danger ? colors.error + '15' : colors.tint + '15' }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.tint} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? colors.error : colors.text }]}>{label}</Text>
      <View style={styles.menuRight}>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, logout } = useAuthStore();

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
  });

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/account/profile')}
          activeOpacity={0.7}
        >
          <Avatar
            source={user?.avatarUrl}
            name={user?.name || user?.email}
            size="lg"
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.name || 'User'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Activity Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity</Text>
        <Card padding="none" style={styles.menuCard}>
          <MenuItem
            icon="ticket-outline"
            label="My Tickets"
            onPress={() => router.push('/(tabs)/tickets')}
          />
          <MenuItem
            icon="receipt-outline"
            label="Order History"
            onPress={() => router.push('/orders')}
          />
          <MenuItem
            icon="bookmark-outline"
            label="Saved Events"
            onPress={() => router.push('/(tabs)/saved')}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            badge={unreadCount?.count}
            onPress={() => router.push('/notifications')}
          />
        </Card>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
        <Card padding="none" style={styles.menuCard}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => router.push('/account/profile')}
          />
          <MenuItem
            icon="settings-outline"
            label="Preferences"
            onPress={() => router.push('/account/settings')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Security"
            onPress={() => router.push('/account/security')}
          />
          <MenuItem
            icon="phone-portrait-outline"
            label="Active Sessions"
            onPress={() => router.push('/account/sessions')}
          />
        </Card>

        {/* Support Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
        <Card padding="none" style={styles.menuCard}>
          <MenuItem
            icon="help-circle-outline"
            label="Help Center"
            onPress={() => {}}
          />
          <MenuItem
            icon="chatbubble-outline"
            label="Contact Support"
            onPress={() => {}}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms & Privacy"
            onPress={() => {}}
          />
        </Card>

        {/* Logout */}
        <Card padding="none" style={styles.menuCard}>
          <MenuItem
            icon="log-out-outline"
            label="Log Out"
            onPress={handleLogout}
            showArrow={false}
            danger
          />
        </Card>

        {/* App Version */}
        <Text style={[styles.version, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>

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
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
});
