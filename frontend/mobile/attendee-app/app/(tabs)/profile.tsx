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
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
  badge?: number;
}

function MenuItem({ icon, label, onPress, showArrow = true, danger = false, badge }: MenuItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? colors.error + '15' : colors.tint + '15' }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.tint} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? colors.error : colors.text }]}>
        {label}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        </View>

        {/* Profile Card */}
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/account/edit' as const)}
          activeOpacity={0.7}
        >
          <Avatar
            source={user?.avatarUrl}
            name={user?.name || user?.email}
            size="lg"
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.name || 'Add your name'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
            {!user?.emailVerified && (
              <View style={[styles.verifyBadge, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="warning" size={12} color={colors.warning} />
                <Text style={[styles.verifyText, { color: colors.warning }]}>
                  Email not verified
                </Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.icon} />
        </TouchableOpacity>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Account
          </Text>
          <Card padding="none" style={styles.menuCard}>
            <MenuItem
              icon="ticket-outline"
              label="My Tickets"
              onPress={() => router.push('/(tabs)/tickets')}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="receipt-outline"
              label="Order History"
              onPress={() => router.push('/orders' as const)}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => router.push('/notifications' as const)}
              badge={3}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="heart-outline"
              label="Following"
              onPress={() => router.push('/account/following' as const)}
            />
          </Card>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Settings
          </Text>
          <Card padding="none" style={styles.menuCard}>
            <MenuItem
              icon="shield-checkmark-outline"
              label="Security"
              onPress={() => router.push('/account/security' as const)}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="location-outline"
              label="Location"
              onPress={() => router.push('/account/location' as const)}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="card-outline"
              label="Payment Methods"
              onPress={() => Alert.alert('Coming Soon', 'Payment methods will be available soon')}
            />
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Support
          </Text>
          <Card padding="none" style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => Alert.alert('Help', 'Contact support@eventflow.com')}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="chatbubble-outline"
              label="Contact Us"
              onPress={() => Alert.alert('Contact', 'Email: support@eventflow.com')}
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <MenuItem
              icon="document-text-outline"
              label="Terms & Privacy"
              onPress={() => Alert.alert('Legal', 'Terms and Privacy Policy')}
            />
          </Card>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Card padding="none" style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleLogout}
              showArrow={false}
              danger
            />
          </Card>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.textSecondary }]}>
            EventFlow v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
    marginTop: 4,
  },
  verifyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    marginLeft: 62,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  version: {
    fontSize: 12,
  },
});
