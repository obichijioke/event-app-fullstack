import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
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

type FilterType = 'upcoming' | 'past';

type EventGroup = {
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  startDate: Date | null;
  tickets: Ticket[];
  categorySlug?: string;
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

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
        upcoming: filter === 'upcoming' ? true : undefined,
        limit: 50,
      }),
  });

  const groupedTickets: EventGroup[] = useMemo(() => {
    const tickets = ticketsData?.data || [];
    const now = new Date();

    const filtered = tickets.filter((t) => {
      const start = parseDate(t.event.startDate);
      if (!start) return filter === 'upcoming';
      return filter === 'upcoming' ? start >= now : start < now;
    });

    const groups = new Map<string, EventGroup>();

    filtered.forEach((ticket) => {
      const event = ticket.event;
      const startDate = parseDate(event.startDate);
      const existing = groups.get(event.id);
      if (existing) {
        existing.tickets.push(ticket);
      } else {
        groups.set(event.id, {
          eventId: event.id,
          eventTitle: event.title,
          eventLocation: event.venue?.name || 'Online event',
          startDate,
          tickets: [ticket],
          categorySlug: event.category?.slug,
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (!a.startDate || !b.startDate) return 0;
      return a.startDate.getTime() - b.startDate.getTime();
    });
  }, [ticketsData, filter]);

  const categoryIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    music: 'musical-notes',
    arts: 'color-palette',
    sports: 'football-outline',
    business: 'briefcase-outline',
    tech: 'laptop-outline',
    food: 'fast-food-outline',
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
      activeOpacity={0.8}
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

  const renderEventGroup = ({ item }: { item: EventGroup }) => {
    const tickets = item.tickets;
    const firstTicket = tickets[0];
    const hasSeat = firstTicket?.seat;
    const ticketLabel = `${firstTicket?.ticketType?.name || 'Ticket'} x${tickets.length}`;
    const startText = item.startDate
      ? format(item.startDate, 'EEE, MMM d - h:mm a')
      : 'Date TBA';
    const iconName = item.categorySlug
      ? categoryIconMap[item.categorySlug] || 'ticket-outline'
      : 'ticket-outline';

    return (
      <TouchableOpacity
        style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/tickets/${firstTicket?.id}` as const)}
        activeOpacity={0.9}
      >
        <View style={styles.groupHeader}>
          <View style={[styles.iconPill, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name={iconName} size={20} color={colors.tint} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
              {item.eventTitle}
            </Text>
            <Text style={[styles.eventDate, { color: colors.textSecondary }]}>{startText}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.eventLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.eventLocation}
              </Text>
            </View>
          </View>
          <View style={styles.statusPill}>
            <StatusBadge status={firstTicket?.status} />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Time</Text>
            <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
              {item.startDate ? format(item.startDate, 'h:mm a') : 'TBA'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Seat</Text>
            <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
              {hasSeat
                ? `${firstTicket.seat?.section} ${firstTicket.seat?.row} ${firstTicket.seat?.number}`
                : 'No seat'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.tint + '15' }]}>
            <Text style={[styles.badgeText, { color: colors.tint }]} numberOfLines={1}>
              {ticketLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Tickets</Text>
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
        <FilterButton type="past" label="Past ticket" />
      </View>

      {/* Tickets List grouped by event */}
      <FlatList
        data={groupedTickets}
        renderItem={renderEventGroup}
        keyExtractor={(item) => item.eventId}
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No tickets yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'upcoming'
                ? "You don't have any upcoming events"
                : "You haven't attended any events yet"}
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
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
    marginBottom: 12,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ticketsList: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventLocation: {
    fontSize: 13,
    flex: 1,
  },
  statusPill: {
    justifyContent: 'flex-start',
  },
  divider: {
    height: 1,
    opacity: 0.8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
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
