import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { eventsApi, savedEventsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [isSaved, setIsSaved] = useState(false);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getEvent(id!),
    enabled: !!id,
  });

  const { data: faqs } = useQuery({
    queryKey: ['eventFaqs', id],
    queryFn: () => eventsApi.getEventFAQs(id!),
    enabled: !!id,
  });

  const handleSave = async () => {
    if (!id) return;
    try {
      const { saved } = await savedEventsApi.toggleSave(id);
      setIsSaved(saved);
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        title: event.title,
        message: `Check out ${event.title} on EventFlow!`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const formatPrice = () => {
    if (!event) return '';
    if (event.isFree) return 'Free';
    if (event.minPrice === event.maxPrice) {
      return `$${event.minPrice?.toFixed(2)}`;
    }
    return `From $${event.minPrice?.toFixed(2)}`;
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error || !event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Event not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.coverImageUrl || 'https://via.placeholder.com/400x250' }}
            style={styles.coverImage}
          />
          {/* Back Button */}
          <SafeAreaView style={styles.headerButtons} edges={['top']}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.card }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.card }]}
                onPress={handleSave}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={isSaved ? colors.tint : colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: colors.card }]}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category Badge */}
          {event.category && (
            <Badge text={event.category.name} variant="primary" style={styles.categoryBadge} />
          )}

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.tint} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                {format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}
              </Text>
              <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
                {format(new Date(event.startDate), 'h:mm a')} -{' '}
                {format(new Date(event.endDate), 'h:mm a')}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name="location-outline" size={20} color={colors.tint} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                {event.venue?.name || 'Online Event'}
              </Text>
              {event.venue && (
                <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
                  {event.venue.address}, {event.venue.city}
                </Text>
              )}
            </View>
          </View>

          {/* Organizer */}
          <TouchableOpacity
            style={styles.organizerRow}
            onPress={() => router.push(`/organizers/${event.organizationId}` as const)}
          >
            <Avatar
              source={event.organization.logoUrl}
              name={event.organization.name}
              size="md"
            />
            <View style={styles.organizerInfo}>
              <Text style={[styles.organizerLabel, { color: colors.textSecondary }]}>
                Organized by
              </Text>
              <Text style={[styles.organizerName, { color: colors.text }]}>
                {event.organization.name}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {event.description || event.shortDescription || 'No description available.'}
            </Text>
          </View>

          {/* Tickets */}
          {event.ticketTypes && event.ticketTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tickets</Text>
              {event.ticketTypes.map((ticketType) => (
                <View
                  key={ticketType.id}
                  style={[styles.ticketRow, { backgroundColor: colors.card }]}
                >
                  <View style={styles.ticketInfo}>
                    <Text style={[styles.ticketName, { color: colors.text }]}>
                      {ticketType.name}
                    </Text>
                    {ticketType.description && (
                      <Text style={[styles.ticketDescription, { color: colors.textSecondary }]}>
                        {ticketType.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.ticketPriceContainer}>
                    <Text style={[styles.ticketPrice, { color: colors.text }]}>
                      {ticketType.price === 0 ? 'Free' : `$${ticketType.price.toFixed(2)}`}
                    </Text>
                    {ticketType.quantityAvailable <= 10 && ticketType.quantityAvailable > 0 && (
                      <Text style={[styles.ticketAvailable, { color: colors.warning }]}>
                        {ticketType.quantityAvailable} left
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* FAQs */}
          {faqs && faqs.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>FAQ</Text>
              {faqs.slice(0, 3).map((faq) => (
                <View key={faq.id} style={styles.faqItem}>
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>
                    {faq.question}
                  </Text>
                  <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                    {faq.answer}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Price</Text>
          <Text style={[styles.price, { color: colors.text }]}>{formatPrice()}</Text>
        </View>
        <Button
          title="Get Tickets"
          onPress={() => router.push(`/events/${id}/checkout` as const)}
          style={styles.buyButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  coverImage: {
    width: width,
    height: 280,
    backgroundColor: '#E5E7EB',
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  categoryBadge: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    lineHeight: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 13,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: 20,
  },
  organizerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  organizerLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  organizerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 16,
  },
  ticketName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  ticketDescription: {
    fontSize: 13,
  },
  ticketPriceContainer: {
    alignItems: 'flex-end',
  },
  ticketPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  ticketAvailable: {
    fontSize: 12,
    marginTop: 2,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
  },
  buyButton: {
    minWidth: 140,
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
