import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/auth-store';
import { eventsApi, savedEventsApi } from '@/lib/api';
import { EventCard } from '@/components/events/event-card';
import { Loading } from '@/components/ui/loading';
import { Avatar } from '@/components/ui/avatar';
import type { Event, Category } from '@/lib/types';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  // Fetch homepage data
  const { data: homepage, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['homepage'],
    queryFn: eventsApi.getHomepage,
  });

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

  // Update saved event IDs when data changes
  React.useEffect(() => {
    if (savedIds) {
      setSavedEventIds(new Set(savedIds));
    }
  }, [savedIds]);

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

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/events?categoryId=${item.id}` as const)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: colors.tint + '15' }]}>
        <Ionicons
          name={(item.icon as keyof typeof Ionicons.glyphMap) || 'musical-notes-outline'}
          size={24}
          color={colors.tint}
        />
      </View>
      <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderFeaturedEvent = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      variant="compact"
      onSaveToggle={handleSaveToggle}
      isSaved={savedEventIds.has(item.id)}
    />
  );

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.tint}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Hello, {user?.firstName || 'there'} 👋
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Find amazing events
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/account' as const)}>
            <Avatar
              source={user?.avatarUrl}
              name={user?.name || user?.email}
              size="md"
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Ionicons name="search-outline" size={20} color={colors.icon} />
          <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
            Search events, artists, venues...
          </Text>
        </TouchableOpacity>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
              <TouchableOpacity onPress={() => router.push('/events' as const)}>
                <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories.slice(0, 8)}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>
        )}

        {/* Featured Events */}
        {homepage?.featuredEvents && homepage.featuredEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Events</Text>
              <TouchableOpacity onPress={() => router.push('/events' as const)}>
                <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={homepage.featuredEvents}
              renderItem={renderFeaturedEvent}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsList}
            />
          </View>
        )}

        {/* Nearby Events */}
        {homepage?.nearbyEvents && homepage.nearbyEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Near You</Text>
              <TouchableOpacity onPress={() => router.push('/events?nearby=true' as const)}>
                <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {homepage.nearbyEvents.slice(0, 5).map((event) => (
              <View key={event.id} style={styles.eventPadding}>
                <EventCard
                  event={event}
                  variant="horizontal"
                  onSaveToggle={handleSaveToggle}
                  isSaved={savedEventIds.has(event.id)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Events */}
        {homepage?.upcomingEvents && homepage.upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming</Text>
              <TouchableOpacity onPress={() => router.push('/events?upcoming=true' as const)}>
                <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {homepage.upcomingEvents.slice(0, 3).map((event) => (
              <View key={event.id} style={styles.eventPadding}>
                <EventCard
                  event={event}
                  onSaveToggle={handleSaveToggle}
                  isSaved={savedEventIds.has(event.id)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {!homepage?.featuredEvents?.length && !homepage?.nearbyEvents?.length && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No events found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Check back later for upcoming events in your area
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  eventsList: {
    paddingHorizontal: 20,
  },
  eventPadding: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
