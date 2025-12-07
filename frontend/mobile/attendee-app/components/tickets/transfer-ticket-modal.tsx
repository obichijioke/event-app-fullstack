import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ticketsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { Ticket } from '@/lib/types';

interface TransferTicketModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}

export function TransferTicketModal({
  visible,
  onClose,
  ticket,
}: TransferTicketModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  const transferMutation = useMutation({
    mutationFn: (data: { ticketId: string; recipientEmail: string }) =>
      ticketsApi.transferTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      Alert.alert(
        'Transfer Initiated',
        `An email has been sent to ${email} to accept the ticket transfer.`,
        [{ text: 'OK', onPress: handleClose }]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Transfer Failed',
        error.response?.data?.message || 'Failed to initiate transfer'
      );
    },
  });

  const handleClose = () => {
    setEmail('');
    setConfirmEmail('');
    onClose();
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleTransfer = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter recipient email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
      Alert.alert('Error', 'Email addresses do not match');
      return;
    }

    if (!ticket) return;

    Alert.alert(
      'Confirm Transfer',
      `Are you sure you want to transfer this ticket to ${email}? This action cannot be undone once accepted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: () => {
            transferMutation.mutate({
              ticketId: ticket.id,
              recipientEmail: email.toLowerCase().trim(),
            });
          },
        },
      ]
    );
  };

  if (!ticket) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Transfer Ticket
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Ticket Info */}
            <View style={[styles.ticketInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.ticketIcon, { backgroundColor: colors.tint + '15' }]}>
                <Ionicons name="ticket-outline" size={24} color={colors.tint} />
              </View>
              <View style={styles.ticketDetails}>
                <Text style={[styles.ticketType, { color: colors.text }]}>
                  {ticket.ticketType?.name}
                </Text>
                <Text style={[styles.eventTitle, { color: colors.textSecondary }]}>
                  {ticket.event?.title}
                </Text>
                {ticket.seat && (
                  <Text style={[styles.seatInfo, { color: colors.textSecondary }]}>
                    Section {ticket.seat.section}, Row {ticket.seat.row}, Seat {ticket.seat.number}
                  </Text>
                )}
              </View>
            </View>

            {/* Transfer Form */}
            <View style={styles.form}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recipient Information
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Enter the email address of the person you want to transfer this ticket to.
                They will receive an email with instructions to accept the transfer.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Recipient Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Confirm Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="Confirm email address"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmEmail}
                  onChangeText={setConfirmEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Important Notice */}
            <View style={[styles.notice, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="warning-outline" size={20} color={colors.warning} />
              <View style={styles.noticeContent}>
                <Text style={[styles.noticeTitle, { color: colors.warning }]}>
                  Important
                </Text>
                <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                  • The recipient must have or create an account{'\n'}
                  • They have 24 hours to accept the transfer{'\n'}
                  • You can cancel the transfer before it's accepted{'\n'}
                  • Once accepted, this cannot be reversed
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <Button
              title="Transfer Ticket"
              onPress={handleTransfer}
              loading={transferMutation.isPending}
              disabled={!email || !confirmEmail}
              style={styles.transferButton}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 20,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  ticketIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ticketDetails: {
    flex: 1,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  seatInfo: {
    fontSize: 13,
  },
  form: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  notice: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  transferButton: {
    width: '100%',
  },
});
