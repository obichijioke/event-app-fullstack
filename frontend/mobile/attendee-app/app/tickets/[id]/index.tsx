import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ticketsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Ticket } from '@/lib/types';

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  issued: { color: '#059669', bgColor: '#D1FAE5', label: 'Active' },
  checked_in: { color: '#7C3AED', bgColor: '#EDE9FE', label: 'Checked In' },
  transferred: { color: '#2563EB', bgColor: '#DBEAFE', label: 'Transferred' },
  refunded: { color: '#DC2626', bgColor: '#FEE2E2', label: 'Refunded' },
  void: { color: '#6B7280', bgColor: '#F3F4F6', label: 'Void' },
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const screenWidth = Dimensions.get('window').width;
  const [activeTicketId, setActiveTicketId] = useState<string | undefined>(id);
  const [activeIndex, setActiveIndex] = useState(0);

  const {
    data: ticket,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getTicket(id!),
    enabled: !!id,
  });

  const { data: eventTickets } = useQuery({
    queryKey: ['event-tickets', ticket?.eventId],
    queryFn: () => ticketsApi.getTickets({ eventId: ticket?.eventId, limit: 50 }),
    enabled: !!ticket?.eventId,
  });

  useEffect(() => {
    if (id && !activeTicketId) {
      setActiveTicketId(id);
    }
  }, [id, activeTicketId]);

  const allTickets: Ticket[] = useMemo(() => {
    const list = eventTickets?.data || [];
    if (ticket) {
      const exists = list.find((t) => t.id === ticket.id);
      return exists ? list : [ticket, ...list];
    }
    return list;
  }, [eventTickets, ticket]);

  const activeTicket = useMemo(() => {
    if (!activeTicketId && allTickets.length) return allTickets[activeIndex] || allTickets[0];
    if (activeTicketId) {
      const found = allTickets.find((t) => t.id === activeTicketId);
      if (found) return found;
    }
    return ticket;
  }, [activeTicketId, allTickets, ticket, activeIndex]);

  useEffect(() => {
    if (!id || !allTickets.length) return;
    const index = allTickets.findIndex((t) => t.id === id);
    if (index >= 0) {
      setActiveIndex(index);
      setActiveTicketId(id);
    }
  }, [id, allTickets]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null; item: Ticket }> }) => {
      if (viewableItems.length && viewableItems[0].index !== null && viewableItems[0].item) {
        const idx = viewableItems[0].index ?? 0;
        setActiveIndex(idx);
        setActiveTicketId(viewableItems[0].item.id);
      }
    }
  );

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const handleTransfer = () => {
    if (!activeTicket) return;

    if (activeTicket.status !== 'issued') {
      Alert.alert('Cannot Transfer', 'Only active tickets can be transferred.');
      return;
    }

    if (isPast(new Date(activeTicket.event.startDate))) {
      Alert.alert('Cannot Transfer', 'Cannot transfer tickets for past events.');
      return;
    }

    router.push(`/tickets/${id}/transfer` as const);
  };

  const handleViewQR = () => {
    router.push(`/tickets/${id}/qr` as const);
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error || !ticket || !activeTicket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Ticket not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const event = activeTicket.event;
  const status = statusConfig[activeTicket.status] || statusConfig.void;
  const isUpcoming = isFuture(new Date(event.startDate));
  const isActive = activeTicket.status === 'issued' && isUpcoming;

  const renderTicketPage = ({ item }: { item: Ticket }) => {
    const eventPage = item.event;
    const statusPage = statusConfig[item.status] || statusConfig.void;
    const isUpcomingPage = isFuture(new Date(eventPage.startDate));
    const isActivePage = item.status === 'issued' && isUpcomingPage;

    return (
      <View style={[styles.page, { width: screenWidth }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Ticket Card */}
          <View style={[styles.ticketCard, { backgroundColor: colors.card }]}>
          {/* Status Badge */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusPage.bgColor }]}>
              <Text style={[styles.statusText, { color: statusPage.color }]}>{statusPage.label}</Text>
            </View>
            {item.seat && (
              <View style={[styles.seatBadge, { backgroundColor: colors.tint + '15' }]}>
                <Text style={[styles.seatText, { color: colors.tint }]}>
                  {item.seat.section} Жњ Row {item.seat.row} Жњ Seat {item.seat.number}
                </Text>
              </View>
            )}
          </View>

          {/* QR Code */}
          {isActivePage && (
            <TouchableOpacity style={styles.qrContainer} onPress={handleViewQR} activeOpacity={0.8}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={item.qrCode || item.id}
                  size={180}
                  backgroundColor="white"
                  color="black"
                />
              </View>
              <Text style={[styles.qrHint, { color: colors.textSecondary }]}>
                Tap to enlarge
              </Text>
            </TouchableOpacity>
          )}

          {/* Ticket Info */}
          <View style={styles.ticketInfo}>
            <Text style={[styles.ticketNumber, { color: colors.textSecondary }]}>
              #{item.ticketNumber || item.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={[styles.ticketType, { color: colors.text }]}>{item.ticketType.name}</Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]}>
            <View style={[styles.dividerCircle, styles.dividerLeft, { backgroundColor: colors.background }]} />
            <View style={[styles.dividerCircle, styles.dividerRight, { backgroundColor: colors.background }]} />
          </View>

          {/* Event Info */}
          <View style={styles.eventInfo}>
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
              {eventPage.title}
            </Text>

            <View style={styles.eventDetail}>
              <Ionicons name="calendar-outline" size={18} color={colors.tint} />
              <View style={styles.eventDetailText}>
                <Text style={[styles.eventDetailLabel, { color: colors.textSecondary }]}>
                  Date & Time
                </Text>
                <Text style={[styles.eventDetailValue, { color: colors.text }]}>
                  {format(new Date(eventPage.startDate), 'EEEE, MMMM d, yyyy')}
                </Text>
                <Text style={[styles.eventDetailValue, { color: colors.text }]}>
                  {format(new Date(eventPage.startDate), 'h:mm a')}
                </Text>
              </View>
            </View>

            {eventPage.venue && (
              <View style={styles.eventDetail}>
                <Ionicons name="location-outline" size={18} color={colors.tint} />
                <View style={styles.eventDetailText}>
                  <Text style={[styles.eventDetailLabel, { color: colors.textSecondary }]}>
                    Location
                  </Text>
                  <Text style={[styles.eventDetailValue, { color: colors.text }]}>
                    {eventPage.venue.name}
                  </Text>
                  <Text style={[styles.eventDetailSubvalue, { color: colors.textSecondary }]}>
                    {eventPage.venue.address}, {eventPage.venue.city}
                  </Text>
                </View>
              </View>
            )}

            {isUpcomingPage && (
              <View style={[styles.countdownBadge, { backgroundColor: colors.tint + '10' }]}>
                <Ionicons name="time-outline" size={16} color={colors.tint} />
                <Text style={[styles.countdownText, { color: colors.tint }]}>
                  {formatDistanceToNow(new Date(eventPage.startDate), { addSuffix: true })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Event Image */}
        {eventPage.coverImageUrl && (
          <TouchableOpacity
            style={styles.eventImageContainer}
            onPress={() => router.push(`/events/${eventPage.id}` as const)}
          >
            <Image source={{ uri: eventPage.coverImageUrl }} style={styles.eventImage} />
            <View style={styles.eventImageOverlay}>
              <Text style={styles.eventImageText}>View Event</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Attendee Info */}
        {(item.attendeeName || item.attendeeEmail) && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendee</Text>
            {item.attendeeName && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>{item.attendeeName}</Text>
              </View>
            )}
            {item.attendeeEmail && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>{item.attendeeEmail}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Check-in Status */}
        {item.status === 'checked_in' && item.checkedInAt && (
          <Card style={styles.section}>
            <View style={styles.checkedInBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#059669" />
              <View style={styles.checkedInText}>
                <Text style={[styles.checkedInTitle, { color: colors.text }]}>Checked In</Text>
                <Text style={[styles.checkedInTime, { color: colors.textSecondary }]}>
                  {format(new Date(item.checkedInAt), 'MMM d, yyyy h:mm a')}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Actions */}
        {isActivePage && (
          <View style={styles.actions}>
            <Button
              title="View Full QR Code"
              onPress={handleViewQR}
              style={styles.primaryButton}
              leftIcon={<Ionicons name="qr-code" size={20} color="#FFFFFF" />}
            />
            <Button
              title="Transfer Ticket"
              variant="outline"
              onPress={handleTransfer}
              style={styles.secondaryButton}
              leftIcon={<Ionicons name="send-outline" size={20} color={colors.tint} />}
            />
          </View>
        )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ticket Details</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={allTickets}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={screenWidth}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderTicketPage}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewConfigRef.current}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
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
  scrollContent: {
    padding: 16,
  },
  ticketCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  seatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  seatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  qrHint: {
    fontSize: 12,
    marginTop: 8,
  },
  ticketInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ticketNumber: {
    fontSize: 13,
    marginBottom: 4,
  },
  ticketType: {
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 2,
    marginVertical: 20,
    position: 'relative',
  },
  dividerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: -11,
  },
  dividerLeft: {
    left: -32,
  },
  dividerRight: {
    right: -32,
  },
  eventInfo: {
    gap: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    gap: 12,
  },
  eventDetailText: {
    flex: 1,
  },
  eventDetailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  eventDetailValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  eventDetailSubvalue: {
    fontSize: 13,
    marginTop: 2,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginTop: 8,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  eventImage: {
    width: '100%',
    height: 120,
  },
  eventImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    gap: 4,
  },
  eventImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
  },
  checkedInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkedInText: {
    flex: 1,
  },
  checkedInTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkedInTime: {
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
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
