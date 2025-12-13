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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import RenderHTML from 'react-native-render-html';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCalendar } from '@/hooks/use-calendar';
import { useMaps } from '@/hooks/use-maps';
import { eventsApi, savedEventsApi, reviewsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { StarRating } from '@/components/reviews';
import { formatCurrency } from '@/lib/utils/format';

const { width } = Dimensions.get('window');

const parseDate = (dateString?: string) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [isSaved, setIsSaved] = useState(false);
  const { addEventToCalendar, isAdding: isAddingToCalendar } = useCalendar();
  const { openDirections: openMapsDirections } = useMaps();

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

  // Fetch agenda
  const { data: agenda } = useQuery({
    queryKey: ['event', id, 'agenda'],
    queryFn: () => eventsApi.getEventAgenda(id!),
    enabled: !!id,
  });

  // Fetch speakers
  const { data: speakers } = useQuery({
    queryKey: ['event', id, 'speakers'],
    queryFn: () => eventsApi.getEventSpeakers(id!),
    enabled: !!id,
  });

  // Fetch review summary
  const { data: reviewSummary } = useQuery({
    queryKey: ['event', id, 'review-summary'],
    queryFn: () => reviewsApi.getEventReviewSummary(id!),
    enabled: !!id,
  });

  // Fetch announcements
  const { data: announcements } = useQuery({
    queryKey: ['event', id, 'announcements'],
    queryFn: () => eventsApi.getEventAnnouncements(id!),
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

  const handleAddToCalendar = async () => {
    if (!event) return;
    await addEventToCalendar(event);
  };

  const formatPrice = () => {
    if (!event) return '';
    if (event.isFree) return 'Free';
    if (event.minPrice === event.maxPrice) {
      return formatCurrency(event.minPrice || 0, event.currency);
    }
    return `From ${formatCurrency(event.minPrice || 0, event.currency)}`;
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

  const startDate = parseDate(event.startDate);
  const endDate = parseDate(event.endDate);

  const dateLabel = startDate
    ? format(startDate, 'EEEE, MMMM d, yyyy')
    : 'Date to be announced';
  const timeRangeLabel = startDate || endDate
    ? [startDate && format(startDate, 'h:mm a'), endDate && format(endDate, 'h:mm a')]
        .filter(Boolean)
        .join(' - ')
    : 'Time to be announced';

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
                onPress={handleAddToCalendar}
                disabled={isAddingToCalendar}
              >
                {isAddingToCalendar ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <Ionicons name="calendar-outline" size={22} color={colors.text} />
                )}
              </TouchableOpacity>
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
              <Text style={[styles.infoTitle, { color: colors.text }]}>{dateLabel}</Text>
              <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
                {timeRangeLabel}
              </Text>
            </View>
          </View>

          {/* Location */}
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => event.venue && openMapsDirections(event.venue)}
            disabled={!event.venue}
            activeOpacity={event.venue ? 0.7 : 1}
          >
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
            {event.venue && (
              <View style={[styles.directionsButton, { backgroundColor: colors.tint }]}>
                <Ionicons name="navigate" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

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
            {event.description || event.shortDescription ? (
              <RenderHTML
                contentWidth={width - 40}
                source={{ html: event.description || event.shortDescription || '' }}
                baseStyle={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24 }}
              />
            ) : (
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                No description available.
              </Text>
            )}
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
                      {ticketType.price === 0
                        ? 'Free'
                        : formatCurrency(ticketType.price, ticketType.currency || event.currency)}
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

          {/* Reviews */}
          <TouchableOpacity
            style={[styles.reviewsSection, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/events/${id}/reviews` as const)}
          >
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Reviews
              </Text>
              <View style={styles.reviewsRating}>
                {reviewSummary && reviewSummary.reviewCount > 0 ? (
                  <>
                    <StarRating rating={reviewSummary.averageRating} size={16} />
                    <Text style={[styles.reviewsCount, { color: colors.textSecondary }]}>
                      {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.reviewCount})
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.reviewsCount, { color: colors.textSecondary }]}>
                    No reviews yet
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
          </TouchableOpacity>

          {/* Event Details - Agenda, Speakers, FAQs, Announcements */}
          {((agenda && agenda.length > 0) || (speakers && speakers.length > 0) || (faqs && faqs.length > 0) || (announcements && announcements.length > 0)) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Event Details</Text>

              {/* Agenda Link */}
              {agenda && agenda.length > 0 && (
                <TouchableOpacity
                  style={[styles.detailLink, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/events/${id}/agenda` as const)}
                >
                  <View style={[styles.detailIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="calendar-outline" size={20} color={colors.tint} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailTitle, { color: colors.text }]}>Agenda</Text>
                    <Text style={[styles.detailSubtitle, { color: colors.textSecondary }]}>
                      {agenda.length} session{agenda.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </TouchableOpacity>
              )}

              {/* Speakers Link */}
              {speakers && speakers.length > 0 && (
                <TouchableOpacity
                  style={[styles.detailLink, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/events/${id}/speakers` as const)}
                >
                  <View style={[styles.detailIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="people-outline" size={20} color={colors.tint} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailTitle, { color: colors.text }]}>Speakers</Text>
                    <Text style={[styles.detailSubtitle, { color: colors.textSecondary }]}>
                      {speakers.length} speaker{speakers.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </TouchableOpacity>
              )}

              {/* FAQs Link */}
              {faqs && faqs.length > 0 && (
                <TouchableOpacity
                  style={[styles.detailLink, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/events/${id}/faqs` as const)}
                >
                  <View style={[styles.detailIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="help-circle-outline" size={20} color={colors.tint} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailTitle, { color: colors.text }]}>FAQs</Text>
                    <Text style={[styles.detailSubtitle, { color: colors.textSecondary }]}>
                      {faqs.length} question{faqs.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </TouchableOpacity>
              )}

              {/* Announcements Link */}
              {announcements && announcements.length > 0 && (
                <TouchableOpacity
                  style={[styles.detailLink, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/events/${id}/announcements` as const)}
                >
                  <View style={[styles.detailIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="megaphone-outline" size={20} color={colors.tint} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailTitle, { color: colors.text }]}>Announcements</Text>
                    <Text style={[styles.detailSubtitle, { color: colors.textSecondary }]}>
                      {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Event Policies */}
          {event.policies && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Event Policies</Text>

              <View style={[styles.policyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Refund Policy */}
                {event.policies.refundPolicy && (
                  <View style={styles.policyRow}>
                    <View style={[styles.policyIcon, { backgroundColor: colors.tint + '15' }]}>
                      <Ionicons name="cash-outline" size={20} color={colors.tint} />
                    </View>
                    <View style={styles.policyContent}>
                      <Text style={[styles.policyTitle, { color: colors.text }]}>Refund Policy</Text>
                      <Text style={[styles.policyText, { color: colors.textSecondary }]}>
                        {event.policies.refundPolicy}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Transfer Policy */}
                <View style={styles.policyRow}>
                  <View style={[styles.policyIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="swap-horizontal-outline" size={20} color={colors.tint} />
                  </View>
                  <View style={styles.policyContent}>
                    <Text style={[styles.policyTitle, { color: colors.text }]}>Ticket Transfer</Text>
                    <Text style={[styles.policyText, { color: colors.textSecondary }]}>
                      {event.policies.transferAllowed
                        ? `Allowed${event.policies.transferCutoff ? ` (${event.policies.transferCutoff} before event)` : ''}`
                        : 'Not allowed'
                      }
                    </Text>
                  </View>
                </View>

                {/* Resale Policy */}
                <View style={[styles.policyRow, { borderBottomWidth: 0 }]}>
                  <View style={[styles.policyIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="pricetag-outline" size={20} color={colors.tint} />
                  </View>
                  <View style={styles.policyContent}>
                    <Text style={[styles.policyTitle, { color: colors.text }]}>Ticket Resale</Text>
                    <Text style={[styles.policyText, { color: colors.textSecondary }]}>
                      {event.policies.resaleAllowed ? 'Allowed' : 'Not allowed'}
                    </Text>
                  </View>
                </View>
              </View>
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
    marginTop: -30,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    paddingTop: 15,
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
  directionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailSubtitle: {
    fontSize: 13,
  },
  reviewsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  reviewsHeader: {
    flex: 1,
  },
  reviewsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  reviewsCount: {
    fontSize: 14,
  },
  policyCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  policyRow: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  policyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  policyText: {
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
