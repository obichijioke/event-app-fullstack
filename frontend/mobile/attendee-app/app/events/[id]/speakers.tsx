import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import type { EventSpeaker } from '@/lib/types';

export default function EventSpeakersScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    data: speakers,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['event', eventId, 'speakers'],
    queryFn: () => eventsApi.getEventSpeakers(eventId!),
    enabled: !!eventId,
  });

  const handleSocialLink = (url: string) => {
    Linking.openURL(url);
  };

  const renderSpeaker = ({ item }: { item: EventSpeaker }) => (
    <Card style={styles.speakerCard}>
      <View style={styles.speakerHeader}>
        <Avatar
          source={item.photoUrl}
          name={item.name}
          size="lg"
        />
        <View style={styles.speakerInfo}>
          <Text style={[styles.speakerName, { color: colors.text }]}>
            {item.name}
          </Text>
          {item.title && (
            <Text style={[styles.speakerTitle, { color: colors.textSecondary }]}>
              {item.title}
            </Text>
          )}

          {/* Social Links */}
          {item.socialLinks && (
            <View style={styles.socialLinks}>
              {item.socialLinks.twitter && (
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: colors.tint + '15' }]}
                  onPress={() => handleSocialLink(item.socialLinks!.twitter!)}
                >
                  <Ionicons name="logo-twitter" size={16} color={colors.tint} />
                </TouchableOpacity>
              )}
              {item.socialLinks.linkedin && (
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: colors.tint + '15' }]}
                  onPress={() => handleSocialLink(item.socialLinks!.linkedin!)}
                >
                  <Ionicons name="logo-linkedin" size={16} color={colors.tint} />
                </TouchableOpacity>
              )}
              {item.socialLinks.website && (
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: colors.tint + '15' }]}
                  onPress={() => handleSocialLink(item.socialLinks!.website!)}
                >
                  <Ionicons name="globe-outline" size={16} color={colors.tint} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {item.bio && (
        <Text style={[styles.speakerBio, { color: colors.textSecondary }]}>
          {item.bio}
        </Text>
      )}
    </Card>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Speakers</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={speakers || []}
        renderItem={renderSpeaker}
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
            <Ionicons name="people-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No speakers listed
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Speaker information hasn't been added for this event
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
  speakerCard: {
    marginBottom: 16,
  },
  speakerHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  speakerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  speakerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  speakerTitle: {
    fontSize: 14,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  socialButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerBio: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
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
