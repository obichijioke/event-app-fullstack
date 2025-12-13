import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ordersApi } from '@/lib/api/orders';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';

export default function OrderConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getOrder(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error || !order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Order not found</Text>
          <Button title="Go Home" onPress={() => router.replace('/(tabs)')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Payment Successful!
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Your order has been confirmed
          </Text>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Details</Text>
          <Card>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Order Number
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Date
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Status
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.statusText, { color: colors.success }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Event Info */}
        {order.event && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Event</Text>
            <Card>
              <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
                {order.event.title}
              </Text>
              <View style={styles.eventInfo}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.eventInfoText, { color: colors.textSecondary }]}>
                  {format(new Date(order.event.startDate), 'EEE, MMM d, yyyy · h:mm a')}
                </Text>
              </View>
              {order.event.venue && (
                <View style={styles.eventInfo}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.eventInfoText, { color: colors.textSecondary }]}>
                    {order.event.venue.name}
                  </Text>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Tickets */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tickets ({order.tickets?.length || 0})
          </Text>
          <Card>
            {order.tickets && order.tickets.length > 0 ? (
              order.tickets.map((ticket, index) => (
                <View
                  key={ticket.id}
                  style={[
                    styles.ticketItem,
                    index < order.tickets.length - 1 && styles.ticketItemBorder,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.ticketIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="ticket-outline" size={20} color={colors.tint} />
                  </View>
                  <View style={styles.ticketInfo}>
                    <Text style={[styles.ticketName, { color: colors.text }]}>
                      {ticket.ticketType?.name || 'Ticket'}
                    </Text>
                    <Text style={[styles.ticketNumber, { color: colors.textSecondary }]}>
                      #{ticket.ticketNumber || ticket.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.ticketStatus, { backgroundColor: colors.success + '15' }]}>
                    <Text style={[styles.ticketStatusText, { color: colors.success }]}>
                      Active
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.noTickets, { color: colors.textSecondary }]}>
                Tickets are being generated...
              </Text>
            )}
          </Card>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Summary</Text>
          <Card>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Subtotal
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(order.subtotal || 0, order.currency)}
              </Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.success }]}>
                  Discount
                </Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  -{formatCurrency(order.discount, order.currency)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Fees
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(order.fees || 0, order.currency)}
              </Text>
            </View>
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                {formatCurrency(order.totalAmount, order.currency)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Email Notice */}
        <View style={[styles.noticeContainer, { backgroundColor: colors.tint + '10' }]}>
          <Ionicons name="mail-outline" size={24} color={colors.tint} />
          <View style={styles.noticeContent}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>
              Confirmation Sent
            </Text>
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              A confirmation email with your tickets has been sent to your email address.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="View My Tickets"
            onPress={() => router.push('/(tabs)/tickets')}
            style={styles.primaryButton}
          />
          <Button
            title="Back to Home"
            variant="outline"
            onPress={() => router.replace('/(tabs)')}
            style={styles.secondaryButton}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  eventInfoText: {
    fontSize: 14,
    flex: 1,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  ticketItemBorder: {
    borderBottomWidth: 1,
  },
  ticketIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  ticketNumber: {
    fontSize: 12,
  },
  ticketStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ticketStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noTickets: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  noticeContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
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
