import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ticketsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = Math.min(SCREEN_WIDTH - 80, 300);

export default function TicketQRScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();
  const [brightness, setBrightness] = useState(1);

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getTicket(id!),
    enabled: !!id,
  });

  const regenerateMutation = useMutation({
    mutationFn: () => ticketsApi.regenerateQR(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error || !ticket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FFFFFF" />
          <Text style={styles.errorText}>Could not load ticket</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#000000' }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeIcon}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* QR Code */}
      <View style={styles.content}>
        <View style={styles.qrCard}>
          <View style={styles.qrWrapper}>
            {regenerateMutation.isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Generating new QR...
                </Text>
              </View>
            ) : (
              <QRCode
                value={ticket.qrCode || ticket.id}
                size={QR_SIZE}
                backgroundColor="white"
                color="black"
              />
            )}
          </View>

          {/* Ticket Info */}
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketType}>{ticket.ticketType.name}</Text>
            <Text style={styles.ticketNumber}>
              #{ticket.ticketNumber || ticket.id.slice(0, 8).toUpperCase()}
            </Text>
            {ticket.seat && (
              <Text style={styles.seatInfo}>
                {ticket.seat.section} · Row {ticket.seat.row} · Seat {ticket.seat.number}
              </Text>
            )}
          </View>
        </View>

        {/* Event Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {ticket.event.title}
        </Text>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="scan-outline" size={20} color="#FFFFFF80" />
          <Text style={styles.instructionsText}>
            Show this QR code to the event staff for entry
          </Text>
        </View>

        {/* Regenerate Button */}
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={() => regenerateMutation.mutate()}
          disabled={regenerateMutation.isPending}
        >
          <Ionicons name="refresh-outline" size={18} color="#FFFFFF80" />
          <Text style={styles.regenerateText}>Regenerate QR Code</Text>
        </TouchableOpacity>
      </View>

      {/* Brightness Tip */}
      <View style={styles.footer}>
        <Ionicons name="sunny-outline" size={16} color="#FFFFFF60" />
        <Text style={styles.footerText}>
          Increase screen brightness for easier scanning
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeIcon: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    marginBottom: 16,
  },
  loadingContainer: {
    width: QR_SIZE,
    height: QR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  ticketInfo: {
    alignItems: 'center',
  },
  ticketType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  ticketNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  seatInfo: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  instructionsText: {
    fontSize: 14,
    color: '#FFFFFF80',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
  },
  regenerateText: {
    fontSize: 14,
    color: '#FFFFFF80',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 13,
    color: '#FFFFFF60',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF20',
    borderRadius: 10,
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
