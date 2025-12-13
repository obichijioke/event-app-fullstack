import React from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { Avatar } from '@/components/ui/avatar';
import type { EventAgenda } from '@/lib/types';

export default function EventAgendaScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    data: agenda,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['event', eventId, 'agenda'],
    queryFn: () => eventsApi.getEventAgenda(eventId!),
    enabled: !!eventId,
  });

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'TBA';
    return format(date, 'h:mm a');
  };

  const renderAgendaItem = ({ item, index }: { item: EventAgenda; index: number }) => {
    const isLast = index === (agenda?.length || 0) - 1;

    return (
      <View style={styles.itemContainer}>
        {/* Time column */}
        <View style={styles.timeColumn}>
          <Text style={[styles.time, { color: colors.tint }]}>
            {formatTime(item.startTime)}
          </Text>
          <Text style={[styles.endTime, { color: colors.textSecondary }]}>
            {formatTime(item.endTime)}
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          <View style={[styles.dot, { backgroundColor: colors.tint }]} />
          {!isLast && (
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          )}
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
          )}
          {item.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.icon} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                {item.location}
              </Text>
            </View>
          )}
          {item.speaker && (
            <TouchableOpacity
              style={[styles.speakerRow, { borderTopColor: colors.border }]}
              onPress={() => router.push(`/events/${eventId}/speakers` as const)}
            >
              <Avatar name={item.speaker.name} source={item.speaker.photoUrl} size="sm" />
              <View style={styles.speakerInfo}>
                <Text style={[styles.speakerName, { color: colors.text }]}>
                  {item.speaker.name}
                </Text>
                {item.speaker.title && (
                  <Text style={[styles.speakerTitle, { color: colors.textSecondary }]}>
                    {item.speaker.title}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Agenda</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={agenda || []}
        renderItem={renderAgendaItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No agenda available
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              The schedule for this event hasn't been published yet
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
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeColumn: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
  },
  endTime: {
    fontSize: 11,
    marginTop: 2,
  },
  timeline: {
    alignItems: 'center',
    width: 24,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  speakerTitle: {
    fontSize: 12,
    marginTop: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
});
