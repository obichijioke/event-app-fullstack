import React, { useState } from 'react';
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
import { notificationsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import type { Notification } from '@/lib/types';

const notificationIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  warning: 'warning-outline',
  error: 'alert-circle-outline',
};

const notificationColors: Record<string, string> = {
  info: '#2563EB',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');

  const {
    data: notificationsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['notifications', selectedFilter],
    queryFn: () =>
      notificationsApi.getNotifications({
        unread: selectedFilter === 'unread' ? true : undefined,
        limit: 50,
      }),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification data
    if (notification.data) {
      const data = notification.data as Record<string, string>;
      if (data.eventId) {
        router.push(`/events/${data.eventId}` as const);
      } else if (data.ticketId) {
        router.push(`/tickets/${data.ticketId}` as const);
      } else if (data.orderId) {
        router.push(`/orders/confirmation/${data.orderId}` as const);
      }
    }
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const handleMarkAllRead = () => {
    if (unreadCount?.count === 0) return;
    markAllAsReadMutation.mutate();
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconName = notificationIcons[item.type] || 'notifications-outline';
    const iconColor = notificationColors[item.type] || colors.tint;

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { backgroundColor: colors.card },
          !item.read && styles.unreadCard,
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDeleteNotification(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text
              style={[
                styles.notificationTitle,
                { color: colors.text },
                !item.read && styles.unreadTitle,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />
            )}
          </View>
          <Text
            style={[styles.notificationMessage, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  const notifications = notificationsData?.data || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        {unreadCount && unreadCount.count > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={[styles.markAllText, { color: colors.tint }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
        {(!unreadCount || unreadCount.count === 0) && <View style={styles.placeholder} />}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: selectedFilter === 'all' ? colors.tint : colors.card,
              borderColor: selectedFilter === 'all' ? colors.tint : colors.border,
            },
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              { color: selectedFilter === 'all' ? '#FFFFFF' : colors.text },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: selectedFilter === 'unread' ? colors.tint : colors.card,
              borderColor: selectedFilter === 'unread' ? colors.tint : colors.border,
            },
          ]}
          onPress={() => setSelectedFilter('unread')}
        >
          <Text
            style={[
              styles.filterText,
              { color: selectedFilter === 'unread' ? '#FFFFFF' : colors.text },
            ]}
          >
            Unread
            {unreadCount && unreadCount.count > 0 && (
              <Text> ({unreadCount.count})</Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {selectedFilter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {selectedFilter === 'unread'
                ? "You've read all your notifications"
                : "When you receive notifications, they'll appear here"}
            </Text>
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
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  markAllButton: {
    padding: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    width: 80,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
