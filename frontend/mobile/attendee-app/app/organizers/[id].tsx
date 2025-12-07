import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Linking,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { organizersApi, savedEventsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { EventCard } from '@/components/events/event-card';
import type { Event } from '@/lib/types';

export default function OrganizerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();

  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  // Fetch organizer profile
  const {
    data: organizer,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['organizer', id],
    queryFn: () => organizersApi.getOrganizer(id!),
    enabled: !!id,
  });

  // Fetch organizer events
  const { data: eventsData } = useQuery({
    queryKey: ['organizer', id, 'events'],
    queryFn: () => organizersApi.getOrganizerEvents(id!, { limit: 10, upcoming: true }),
    enabled: !!id,
  });

  // Check if following
  const { data: followingData } = useQuery({
    queryKey: ['organizer', id, 'following'],
    queryFn: () => organizersApi.isFollowing(id!),
    enabled: !!id,
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

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () =>
      followingData?.following
        ? organizersApi.unfollowOrganizer(id!)
        : organizersApi.followOrganizer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer', id] });
      queryClient.invalidateQueries({ queryKey: ['organizer', id, 'following'] });
    },
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

  const handleOpenWebsite = () => {
    if (organizer?.websiteUrl) {
      Linking.openURL(organizer.websiteUrl);
    }
  };

  const handleShare = async () => {
    if (!organizer) return;
    try {
      await Share.share({
        title: organizer.name,
        message: `Check out ${organizer.name} on EventFlow! eventflow://organizers/${id}`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!organizer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Organizer not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const isFollowing = followingData?.following || false;
  const events = eventsData?.data || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

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
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            source={organizer.logoUrl}
            name={organizer.name}
            size="xl"
          />
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={[styles.organizerName, { color: colors.text }]}>
                {organizer.name}
              </Text>
              {organizer.verified && (
                <Ionicons name="checkmark-circle" size={22} color="#2563EB" />
              )}
            </View>
            {organizer.slug && (
              <Text style={[styles.organizerHandle, { color: colors.textSecondary }]}>
                @{organizer.slug}
              </Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {organizer.eventCount || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Events</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {organizer.followerCount || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={isFollowing ? 'Following' : 'Follow'}
            variant={isFollowing ? 'outline' : 'primary'}
            onPress={() => followMutation.mutate()}
            disabled={followMutation.isPending}
            style={styles.followButton}
            leftIcon={
              <Ionicons
                name={isFollowing ? 'checkmark' : 'add'}
                size={18}
                color={isFollowing ? colors.tint : '#FFFFFF'}
              />
            }
          />
          {organizer.websiteUrl && (
            <TouchableOpacity
              style={[styles.websiteButton, { borderColor: colors.border }]}
              onPress={handleOpenWebsite}
            >
              <Ionicons name="globe-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        {organizer.description && (
          <View style={styles.descriptionSection}>
            <Text style={[styles.description, { color: colors.text }]}>
              {organizer.description}
            </Text>
          </View>
        )}

        {/* Upcoming Events */}
        {events.length > 0 && (
          <View style={styles.eventsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
              <TouchableOpacity
                onPress={() =>
                  router.push(`/events?organizationId=${id}` as const)
                }
              >
                <Text style={[styles.seeAll, { color: colors.tint }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {events.map((event) => (
              <View key={event.id} style={styles.eventItem}>
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

        {/* Empty Events */}
        {events.length === 0 && (
          <View style={styles.emptyEvents}>
            <Ionicons name="calendar-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No upcoming events
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Follow this organizer to get notified when they create new events
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  shareButton: {
    padding: 4,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  organizerName: {
    fontSize: 24,
    fontWeight: '700',
  },
  organizerHandle: {
    fontSize: 15,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 40,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  followButton: {
    flex: 1,
  },
  websiteButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  eventsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  eventItem: {
    marginBottom: 0,
  },
  emptyEvents: {
    alignItems: 'center',
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
