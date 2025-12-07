import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { savedEventsApi } from '@/lib/api';
import { EventCard } from '@/components/events/event-card';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import type { Event, PaginatedResponse } from '@/lib/types';

export default function SavedScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  const {
    data: savedEventsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<PaginatedResponse<Event>>({
    queryKey: ['savedEvents'],
    queryFn: () => savedEventsApi.getSavedEvents(1, 50),
  });

  // Update saved event IDs when data changes
  useEffect(() => {
    if (savedEventsData?.data) {
      setSavedEventIds(new Set(savedEventsData.data.map((e) => e.id)));
    }
  }, [savedEventsData]);

  const handleSaveToggle = async (eventId: string) => {
    try {
      const { saved } = await savedEventsApi.toggleSave(eventId);
      setSavedEventIds((prev) => {
        const newSet = new Set(prev);
        if (saved) {
          newSet.add(eventId);
        } else {
          newSet.delete(eventId);
        }
        return newSet;
      });
      // Refetch to update the list
      refetch();
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <EventCard
        event={item}
        onSaveToggle={handleSaveToggle}
        isSaved={savedEventIds.has(item.id)}
      />
    </View>
  );

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Saved Events</Text>
        {savedEventsData?.data && savedEventsData.data.length > 0 && (
          <Text style={[styles.count, { color: colors.textSecondary }]}>
            {savedEventsData.meta.total} saved
          </Text>
        )}
      </View>

      {/* Events List */}
      <FlatList
        data={savedEventsData?.data || []}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
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
              <Ionicons name="bookmark-outline" size={48} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No saved events
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Save events you're interested in to view them here later
            </Text>
            <Button
              title="Discover Events"
              onPress={() => router.push('/(tabs)/')}
              style={styles.discoverButton}
            />
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
  count: {
    fontSize: 14,
  },
  eventsList: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  eventItem: {
    marginBottom: 0,
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
  discoverButton: {
    minWidth: 160,
  },
});
