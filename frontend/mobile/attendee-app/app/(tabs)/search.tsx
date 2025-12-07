import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi, savedEventsApi } from '@/lib/api';
import { EventCard } from '@/components/events/event-card';
import type { Event, Category } from '@/lib/types';

// Simple debounce implementation
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: eventsApi.getCategories,
  });

  // Fetch saved event IDs
  useQuery({
    queryKey: ['savedEventIds'],
    queryFn: savedEventsApi.getSavedEventIds,
    onSuccess: (ids) => setSavedEventIds(new Set(ids)),
  });

  // Search events
  const {
    data: searchResults,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['events', 'search', debouncedQuery, selectedCategory],
    queryFn: () =>
      eventsApi.getEvents({
        search: debouncedQuery || undefined,
        categoryId: selectedCategory || undefined,
        status: 'live',
        limit: 20,
      }),
    enabled: debouncedQuery.length >= 2 || selectedCategory !== null,
  });

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

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <EventCard
        event={item}
        variant="horizontal"
        onSaveToggle={handleSaveToggle}
        isSaved={savedEventIds.has(item.id)}
      />
    </View>
  );

  const renderCategory = ({ item }: { item: Category }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          {
            backgroundColor: isSelected ? colors.tint : colors.card,
            borderColor: isSelected ? colors.tint : colors.border,
          },
        ]}
        onPress={() => setSelectedCategory(isSelected ? null : item.id)}
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

  const showResults = debouncedQuery.length >= 2 || selectedCategory !== null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Search</Text>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={20} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search events, artists, venues..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {(searchQuery.length > 0 || selectedCategory) && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
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

      {/* Results */}
      {showResults ? (
        <FlatList
          data={searchResults?.data || []}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            isFetching ? (
              <View style={styles.loadingHeader}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Searching...
                </Text>
              </View>
            ) : searchResults?.data.length ? (
              <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                {searchResults.meta.total} events found
              </Text>
            ) : null
          }
          ListEmptyComponent={
            !isFetching ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No events found
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Try adjusting your search or filters
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.initialState}>
          <View style={[styles.searchIcon, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="search" size={40} color={colors.tint} />
          </View>
          <Text style={[styles.initialTitle, { color: colors.text }]}>
            Search for events
          </Text>
          <Text style={[styles.initialText, { color: colors.textSecondary }]}>
            Find concerts, conferences, workshops, and more
          </Text>
        </View>
      )}
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
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  categoriesSection: {
    paddingBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 20,
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
  resultsList: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  eventItem: {
    marginBottom: 0,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  resultsCount: {
    fontSize: 14,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
  initialState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  searchIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  initialTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  initialText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
