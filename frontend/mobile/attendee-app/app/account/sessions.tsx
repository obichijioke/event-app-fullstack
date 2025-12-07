import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { accountApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Session } from '@/lib/types';

const getDeviceIcon = (userAgent?: string): keyof typeof Ionicons.glyphMap => {
  if (!userAgent) return 'phone-portrait-outline';
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
    return 'logo-apple';
  }
  if (ua.includes('android')) {
    return 'logo-android';
  }
  if (ua.includes('mac')) {
    return 'laptop-outline';
  }
  if (ua.includes('windows')) {
    return 'desktop-outline';
  }
  return 'phone-portrait-outline';
};

const getDeviceName = (session: Session): string => {
  if (session.deviceName) return session.deviceName;
  if (!session.userAgent) return 'Unknown Device';
  const ua = session.userAgent.toLowerCase();
  if (ua.includes('iphone')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('android')) return 'Android Device';
  if (ua.includes('mac')) return 'Mac';
  if (ua.includes('windows')) return 'Windows PC';
  return 'Unknown Device';
};

export default function SessionsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();

  const {
    data: sessions,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['account', 'sessions'],
    queryFn: accountApi.getSessions,
  });

  const revokeMutation = useMutation({
    mutationFn: accountApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'sessions'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to revoke session');
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: accountApi.revokeAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'sessions'] });
      Alert.alert('Success', 'All other sessions have been logged out');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to revoke sessions');
    },
  });

  const handleRevokeSession = (session: Session) => {
    if (session.isCurrent) {
      Alert.alert('Cannot Revoke', 'You cannot revoke your current session');
      return;
    }

    Alert.alert(
      'Revoke Session',
      `Are you sure you want to log out ${getDeviceName(session)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => revokeMutation.mutate(session.id),
        },
      ]
    );
  };

  const handleRevokeAll = () => {
    const otherSessions = sessions?.filter((s) => !s.isCurrent).length || 0;
    if (otherSessions === 0) {
      Alert.alert('No Other Sessions', 'You have no other active sessions');
      return;
    }

    Alert.alert(
      'Log Out All Devices',
      `This will log out ${otherSessions} other device${otherSessions > 1 ? 's' : ''}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out All',
          style: 'destructive',
          onPress: () => revokeAllMutation.mutate(),
        },
      ]
    );
  };

  const renderSession = ({ item }: { item: Session }) => {
    const deviceIcon = getDeviceIcon(item.userAgent);
    const deviceName = getDeviceName(item);

    return (
      <TouchableOpacity
        style={[
          styles.sessionCard,
          { backgroundColor: colors.card },
          item.isCurrent && styles.currentSession,
        ]}
        onPress={() => handleRevokeSession(item)}
        activeOpacity={item.isCurrent ? 1 : 0.7}
        disabled={item.isCurrent}
      >
        <View style={[styles.sessionIcon, { backgroundColor: colors.tint + '15' }]}>
          <Ionicons name={deviceIcon} size={24} color={colors.tint} />
        </View>
        <View style={styles.sessionInfo}>
          <View style={styles.sessionHeader}>
            <Text style={[styles.sessionName, { color: colors.text }]}>{deviceName}</Text>
            {item.isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            )}
          </View>
          {item.ipAddress && (
            <Text style={[styles.sessionMeta, { color: colors.textSecondary }]}>
              IP: {item.ipAddress}
            </Text>
          )}
          <Text style={[styles.sessionTime, { color: colors.textSecondary }]}>
            Last active {formatDistanceToNow(new Date(item.lastActiveAt), { addSuffix: true })}
          </Text>
        </View>
        {!item.isCurrent && (
          <Ionicons name="close-circle-outline" size={24} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  const currentSession = sessions?.find((s) => s.isCurrent);
  const otherSessions = sessions?.filter((s) => !s.isCurrent) || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Active Sessions</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.sessionsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.tint}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              These are the devices currently logged into your account. You can log out any
              session except your current one.
            </Text>
          </View>
        }
        ListFooterComponent={
          otherSessions.length > 0 ? (
            <View style={styles.listFooter}>
              <Button
                title="Log Out All Other Devices"
                variant="outline"
                onPress={handleRevokeAll}
                disabled={revokeAllMutation.isPending}
                leftIcon={<Ionicons name="log-out-outline" size={20} color={colors.tint} />}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="phone-portrait-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No sessions found</Text>
          </View>
        }
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
  sessionsList: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 14,
  },
  currentSession: {
    borderWidth: 2,
    borderColor: '#059669',
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  sessionMeta: {
    fontSize: 13,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
  },
  listFooter: {
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});
