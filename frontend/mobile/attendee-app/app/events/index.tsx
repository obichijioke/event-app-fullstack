import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi, savedEventsApi } from '@/lib/api';
import { EventCard } from '@/components/events/event-card';
import { Loading } from '@/components/ui/loading';
import type { Event, Category } from '@/lib/types';

export default function EventsListScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams<{
    categoryId?: string;
    nearby?: string;
    upcoming?: string;
  }>();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    params.categoryId || null
  );
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  // Update category from URL params
  useEffect(() => {
    if (params.categoryId) {
      setSelectedCategoryId(params.categoryId);
    }
  }, [params.categoryId]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: eventsApi.getCategories,
  });

  // Fetch saved event IDs
  const { data: savedIds } = useQuery({
    queryKey: ['savedEventIds'],
    queryFn: savedEventsApi.getSavedEventIds,
  });

  useEffect(() => {
    if (savedIds) {
      setSavedEventIds(new Set(savedIds));
    }
  }, [savedIds]);

  const isNearby = params.nearby === 'true';

  // Fetch nearby events (uses user's stored location)
  const {
    data: nearbyData,
    isLoading: isLoadingNearby,
    refetch: refetchNearby,
    isRefetching: isRefetchingNearby,
  } = useQuery({
    queryKey: ['events', 'nearby'],
    queryFn: () => eventsApi.getNearbyEventsForMe(),
    enabled: isNearby,
  });

  // Fetch regular events with infinite scroll
  const {
    data,
    isLoading: isLoadingEvents,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchEvents,
    isRefetching: isRefetchingEvents,
  } = useInfiniteQuery({
    queryKey: ['events', 'list', selectedCategoryId, params.upcoming],
    queryFn: ({ pageParam = 1 }) =>
      eventsApi.getEvents({
        page: pageParam,
        limit: 10,
        categoryId: selectedCategoryId || undefined,
        status: 'live',
        upcoming: params.upcoming === 'true' ? true : undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !isNearby,
  });

  const isLoading = isNearby ? isLoadingNearby : isLoadingEvents;
  const isRefetching = isNearby ? isRefetchingNearby : isRefetchingEvents;
  const refetch = isNearby ? refetchNearby : refetchEvents;
  const events = isNearby
    ? nearbyData?.data || []
    : data?.pages.flatMap((page) => page.data) || [];

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
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  const getTitle = () => {
    if (params.nearby === 'true') return 'Events Near You';
    if (params.upcoming === 'true') return 'Upcoming Events';
    if (selectedCategoryId) {
      const category = categories?.find((c) => c.id === selectedCategoryId);
      return category?.name || 'Events';
    }
    return 'All Events';
  };

  const renderCategory = ({ item }: { item: Category }) => {
    const isSelected = selectedCategoryId === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          {
            backgroundColor: isSelected ? colors.tint : colors.card,
            borderColor: isSelected ? colors.tint : colors.border,
          },
        ]}
        onPress={() => setSelectedCategoryId(isSelected ? null : item.id)}
      >
        <Ionicons
          name={(item.icon as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'}
          size={16}
          color={isSelected ? '#FFFFFF' : colors.text}
        />
        <Text
          style={[
            styles.categoryChipText,
            { color: isSelected ? '#FFFFFF' : colors.text },
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
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

  const renderFooter = () => {
    if (isNearby || !isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.tint} />
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
        <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/search')}
          style={styles.searchButton}
        >
          <Ionicons name="search-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Categories Filter */}
      {categories && categories.length > 0 && !params.nearby && !params.upcoming && (
        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={colors.tint}
          />
        }
        onEndReached={() => {
          if (!isNearby && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !isFetching ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No events found
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {selectedCategoryId
                  ? 'Try selecting a different category'
                  : 'Check back later for new events'}
              </Text>
            </View>
          ) : null
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
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  searchButton: {
    padding: 4,
  },
  categoriesSection: {
    paddingBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  eventItem: {
    marginBottom: 0,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
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
  },
});
