import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { accountApi, ticketsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import type { TicketTransfer, TransferStatus } from '@/lib/types';

type FilterType = 'all' | 'sent' | 'received';

export default function TransfersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<FilterType>('all');

  const {
    data: transfersData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['transfers', filter],
    queryFn: () => accountApi.getTransfers({ type: filter, limit: 50 }),
  });

  const acceptMutation = useMutation({
    mutationFn: (transferId: string) => ticketsApi.acceptTransfer(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      Alert.alert('Success', 'Transfer accepted! The ticket is now yours.');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to accept transfer'
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (transferId: string) => ticketsApi.cancelTransfer(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      Alert.alert('Success', 'Transfer has been canceled.');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to cancel transfer'
      );
    },
  });

  const handleAccept = (transfer: TicketTransfer) => {
    Alert.alert(
      'Accept Transfer',
      'Are you sure you want to accept this ticket transfer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => acceptMutation.mutate(transfer.id),
        },
      ]
    );
  };

  const handleCancel = (transfer: TicketTransfer) => {
    Alert.alert(
      'Cancel Transfer',
      'Are you sure you want to cancel this transfer?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(transfer.id),
        },
      ]
    );
  };

  const getStatusColor = (status: TransferStatus) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'accepted':
        return colors.success;
      case 'canceled':
      case 'rejected':
      case 'expired':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: TransferStatus): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'accepted':
        return 'checkmark-circle-outline';
      case 'canceled':
      case 'rejected':
        return 'close-circle-outline';
      case 'expired':
        return 'alert-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderTransfer = ({ item }: { item: TicketTransfer }) => {
    const isSent = item.fromUserId === item.fromUserId; // Will need to compare with current user
    const isReceived = !!item.toUser;
    const statusColor = getStatusColor(item.status);
    const isExpired = new Date(item.expiresAt) < new Date() && item.status === 'pending';

    return (
      <View style={[styles.transferCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.transferHeader}>
          <View style={[styles.directionBadge, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons
              name={isReceived ? 'arrow-down' : 'arrow-up'}
              size={16}
              color={colors.tint}
            />
          </View>
          <View style={styles.transferInfo}>
            <Text style={[styles.eventName, { color: colors.text }]}>
              {item.ticket?.event?.title || 'Event'}
            </Text>
            <Text style={[styles.ticketType, { color: colors.textSecondary }]}>
              {item.ticket?.ticketType?.name || 'Ticket'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Ionicons name={getStatusIcon(item.status)} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isExpired ? 'Expired' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={[styles.transferDetails, { borderTopColor: colors.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              {isReceived ? 'From' : 'To'}
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {isReceived ? item.fromUser?.email || 'Unknown' : item.toEmail}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
            </Text>
          </View>
          {item.status === 'pending' && !isExpired && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Expires</Text>
              <Text style={[styles.detailValue, { color: colors.warning }]}>
                {format(new Date(item.expiresAt), 'MMM d, yyyy h:mm a')}
              </Text>
            </View>
          )}
        </View>

        {/* Actions for pending transfers */}
        {item.status === 'pending' && !isExpired && (
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            {isReceived ? (
              <Button
                title="Accept Transfer"
                onPress={() => handleAccept(item)}
                loading={acceptMutation.isPending}
                style={styles.actionButton}
              />
            ) : (
              <Button
                title="Cancel Transfer"
                variant="outline"
                onPress={() => handleCancel(item)}
                loading={cancelMutation.isPending}
                style={styles.actionButton}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'sent', label: 'Sent' },
    { value: 'received', label: 'Received' },
  ];

  if (isLoading) {
    return <Loading fullScreen />;
  }

  const transfers = transfersData?.data || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ticket Transfers</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === f.value ? colors.tint : colors.card,
                borderColor: filter === f.value ? colors.tint : colors.border,
              },
            ]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.value ? '#FFFFFF' : colors.text },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={transfers}
        renderItem={renderTransfer}
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
            <Ionicons name="swap-horizontal-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No transfers
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'sent'
                ? "You haven't sent any ticket transfers"
                : filter === 'received'
                ? "You haven't received any ticket transfers"
                : "You don't have any ticket transfers"}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  transferCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  transferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  directionBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transferInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  ticketType: {
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transferDetails: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    padding: 14,
    borderTopWidth: 1,
  },
  actionButton: {
    width: '100%',
  },
  emptyContainer: {
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
});
