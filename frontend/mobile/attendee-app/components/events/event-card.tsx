import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Event } from '@/lib/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'horizontal';
  onSaveToggle?: (eventId: string) => void;
  isSaved?: boolean;
}

export function EventCard({
  event,
  variant = 'default',
  onSaveToggle,
  isSaved = false,
}: EventCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handlePress = () => {
    router.push(`/events/${event.id}`);
  };

  const handleSave = () => {
    onSaveToggle?.(event.id);
  };

  const formatPrice = () => {
    if (event.isFree) return 'Free';
    if (event.minPrice === event.maxPrice) {
      return `$${event.minPrice?.toFixed(2)}`;
    }
    return `From $${event.minPrice?.toFixed(2)}`;
  };

  const formatDate = () => {
    try {
      return format(new Date(event.startDate), 'EEE, MMM d · h:mm a');
    } catch {
      return event.startDate;
    }
  };

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[styles.horizontalCard, { backgroundColor: colors.card }]}
      >
        <Image
          source={{ uri: event.coverImageUrl || 'https://via.placeholder.com/120x120' }}
          style={styles.horizontalImage}
        />
        <View style={styles.horizontalContent}>
          <Text style={[styles.horizontalDate, { color: colors.tint }]}>
            {formatDate()}
          </Text>
          <Text
            style={[styles.horizontalTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {event.title}
          </Text>
          <Text style={[styles.horizontalVenue, { color: colors.textSecondary }]} numberOfLines={1}>
            {event.venue?.name || 'Online Event'}
          </Text>
          <View style={styles.horizontalFooter}>
            <Text style={[styles.price, { color: colors.text }]}>{formatPrice()}</Text>
          </View>
        </View>
        {onSaveToggle && (
          <TouchableOpacity onPress={handleSave} style={styles.horizontalSaveBtn}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? colors.tint : colors.icon}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[styles.compactCard, { backgroundColor: colors.card }]}
      >
        <Image
          source={{ uri: event.coverImageUrl || 'https://via.placeholder.com/160x100' }}
          style={styles.compactImage}
        />
        <View style={styles.compactContent}>
          <Text style={[styles.compactDate, { color: colors.tint }]}>
            {format(new Date(event.startDate), 'MMM d')}
          </Text>
          <Text
            style={[styles.compactTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {event.title}
          </Text>
          <Text style={[styles.compactPrice, { color: colors.textSecondary }]}>
            {formatPrice()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Default card
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.card }]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: event.coverImageUrl || 'https://via.placeholder.com/400x200' }}
          style={styles.image}
        />
        {onSaveToggle && (
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: colors.card }]}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? colors.tint : colors.icon}
            />
          </TouchableOpacity>
        )}
        {event.isFree && (
          <View style={[styles.freeBadge, { backgroundColor: colors.success }]}>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.date, { color: colors.tint }]}>{formatDate()}</Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
            {event.venue?.name || 'Online Event'}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.text }]}>{formatPrice()}</Text>
          {event.attendeeCount !== undefined && (
            <View style={styles.attendees}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.attendeeCount, { color: colors.textSecondary }]}>
                {event.attendeeCount} going
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Default card styles
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  freeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  location: {
    fontSize: 13,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
  },
  attendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeeCount: {
    fontSize: 12,
  },

  // Compact card styles
  compactCard: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  compactImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E5E7EB',
  },
  compactContent: {
    padding: 10,
  },
  compactDate: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 17,
  },
  compactPrice: {
    fontSize: 12,
  },

  // Horizontal card styles
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    padding: 12,
  },
  horizontalImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  horizontalContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  horizontalDate: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  horizontalTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  horizontalVenue: {
    fontSize: 12,
    marginBottom: 4,
  },
  horizontalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalSaveBtn: {
    padding: 8,
    alignSelf: 'flex-start',
  },
});
