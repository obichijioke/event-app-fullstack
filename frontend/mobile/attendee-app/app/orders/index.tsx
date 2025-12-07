import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ordersApi } from '@/lib/api/orders';
import { Loading } from '@/components/ui/loading';
import type { Order, OrderStatus } from '@/lib/types';

type FilterType = 'all' | 'paid' | 'pending' | 'refunded';

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  paid: { bg: '#D1FAE5', text: '#059669' },
  canceled: { bg: '#FEE2E2', text: '#DC2626' },
  refunded: { bg: '#E0E7FF', text: '#4F46E5' },
  chargeback: { bg: '#FEE2E2', text: '#DC2626' },
};

export default function OrdersHistoryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [filter, setFilter] = useState<FilterType>('all');

  const {
    data: ordersData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['orders', filter],
    queryFn: () =>
      ordersApi.getOrders({
        status: filter === 'all' ? undefined : filter,
        limit: 50,
      }),
  });

  const formatPrice = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const statusColor = statusColors[item.status] || statusColors.pending;

    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/orders/confirmation/${item.id}` as const)}
        activeOpacity={0.7}
      >
        {/* Event Image */}
        <Image
          source={{ uri: item.event?.coverImageUrl || 'https://via.placeholder.com/80x80' }}
          style={styles.orderImage}
        />

        {/* Order Content */}
        <View style={styles.orderContent}>
          {/* Header with order number and status */}
          <View style={styles.orderHeader}>
            <Text style={[styles.orderNumber, { color: colors.textSecondary }]}>
              #{item.orderNumber || item.id.slice(0, 8).toUpperCase()}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Event Title */}
          <Text style={[styles.orderTitle, { color: colors.text }]} numberOfLines={2}>
            {item.event?.title || 'Event'}
          </Text>

          {/* Date and Tickets */}
          <View style={styles.orderMeta}>
            <View style={styles.orderMetaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.orderMetaText, { color: colors.textSecondary }]}>
                {format(new Date(item.createdAt), 'MMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.orderMetaItem}>
              <Ionicons name="ticket-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.orderMetaText, { color: colors.textSecondary }]}>
                {item.tickets?.length || 0} ticket{item.tickets?.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Total */}
          <View style={styles.orderFooter}>
            <Text style={[styles.orderTotal, { color: colors.text }]}>
              {formatPrice(item.totalAmount, item.currency)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: filter === type ? colors.tint : colors.card,
          borderColor: filter === type ? colors.tint : colors.border,
        },
      ]}
      onPress={() => setFilter(type)}
    >
      <Text
        style={[
          styles.filterButtonText,
          { color: filter === type ? '#FFFFFF' : colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

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
        <Text style={[styles.title, { color: colors.text }]}>Order History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <FilterButton type="all" label="All" />
        <FilterButton type="paid" label="Paid" />
        <FilterButton type="pending" label="Pending" />
        <FilterButton type="refunded" label="Refunded" />
      </View>

      {/* Orders List */}
      <FlatList
        data={ordersData?.data || []}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ordersList}
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
              <Ionicons name="receipt-outline" size={48} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No orders yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'all'
                ? 'Your order history will appear here'
                : `No ${filter} orders found`}
            </Text>
            <TouchableOpacity
              style={[styles.browseButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/(tabs)/')}
            >
              <Text style={styles.browseButtonText}>Browse Events</Text>
            </TouchableOpacity>
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
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  orderCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    padding: 12,
  },
  orderImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  orderContent: {
    flex: 1,
    marginLeft: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  orderMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  orderMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderMetaText: {
    fontSize: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
