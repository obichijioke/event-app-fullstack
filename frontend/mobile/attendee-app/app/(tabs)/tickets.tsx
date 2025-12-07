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
import { ticketsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { StatusBadge } from '@/components/ui/badge';
import type { Ticket } from '@/lib/types';

type FilterType = 'all' | 'upcoming' | 'past';

export default function TicketsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [filter, setFilter] = useState<FilterType>('upcoming');

  const {
    data: ticketsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['tickets', filter],
    queryFn: () =>
      ticketsApi.getTickets({
        upcoming: filter === 'upcoming' ? true : filter === 'past' ? false : undefined,
        limit: 50,
      }),
  });

  const renderTicket = ({ item }: { item: Ticket }) => {
    const event = item.event;
    const isUpcoming = new Date(event.startDate) > new Date();

    return (
      <TouchableOpacity
        style={[styles.ticketCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/tickets/${item.id}` as const)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: event.coverImageUrl || 'https://via.placeholder.com/80x80' }}
          style={styles.ticketImage}
        />
        <View style={styles.ticketContent}>
          <View style={styles.ticketHeader}>
            <Text style={[styles.ticketDate, { color: colors.tint }]}>
              {format(new Date(event.startDate), 'EEE, MMM d · h:mm a')}
            </Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={[styles.ticketTitle, { color: colors.text }]} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={[styles.ticketType, { color: colors.textSecondary }]}>
            {item.ticketType.name}
            {item.seat && ` · ${item.seat.section} Row ${item.seat.row} Seat ${item.seat.number}`}
          </Text>
          <View style={styles.ticketFooter}>
            <View style={styles.ticketLocation}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.ticketVenue, { color: colors.textSecondary }]} numberOfLines={1}>
                {event.venue?.name || 'Online Event'}
              </Text>
            </View>
            {isUpcoming && (
              <View style={styles.qrIcon}>
                <Ionicons name="qr-code-outline" size={16} color={colors.tint} />
              </View>
            )}
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
        <Text style={[styles.title, { color: colors.text }]}>My Tickets</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/account/transfers' as const)}>
            <Ionicons name="swap-horizontal-outline" size={22} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/orders' as const)}>
            <Text style={[styles.ordersLink, { color: colors.tint }]}>Orders</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <FilterButton type="upcoming" label="Upcoming" />
        <FilterButton type="past" label="Past" />
        <FilterButton type="all" label="All" />
      </View>

      {/* Tickets List */}
      <FlatList
        data={ticketsData?.data || []}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ticketsList}
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
            <Ionicons name="ticket-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No tickets yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'upcoming'
                ? "You don't have any upcoming events"
                : filter === 'past'
                ? "You haven't attended any events yet"
                : "Purchase tickets to your favorite events"}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ordersLink: {
    fontSize: 15,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ticketsList: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  ticketCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    padding: 12,
  },
  ticketImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  ticketContent: {
    flex: 1,
    marginLeft: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  ticketType: {
    fontSize: 12,
    marginBottom: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  ticketVenue: {
    fontSize: 12,
    flex: 1,
  },
  qrIcon: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
