import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ticketsApi } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TicketTransferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();

  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getTicket(id!),
    enabled: !!id,
  });

  const transferMutation = useMutation({
    mutationFn: () =>
      ticketsApi.transferTicket({
        ticketId: id!,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientName: recipientName.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      Alert.alert(
        'Transfer Initiated',
        `An email has been sent to ${recipientEmail}. The transfer will complete when they accept it.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: Error) => {
      Alert.alert('Transfer Failed', error.message || 'Could not transfer ticket. Please try again.');
    },
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleTransfer = () => {
    const email = recipientEmail.trim().toLowerCase();

    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError(null);

    Alert.alert(
      'Confirm Transfer',
      `Are you sure you want to transfer this ticket to ${email}? This action cannot be undone once accepted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: () => transferMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!ticket) {
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Transfer Ticket</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ticket Summary */}
          <Card style={styles.ticketSummary}>
            <View style={styles.ticketHeader}>
              <Ionicons name="ticket-outline" size={24} color={colors.tint} />
              <View style={styles.ticketInfo}>
                <Text style={[styles.ticketType, { color: colors.text }]}>
                  {ticket.ticketType.name}
                </Text>
                <Text style={[styles.ticketNumber, { color: colors.textSecondary }]}>
                  #{ticket.ticketNumber || ticket.id.slice(0, 8).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={[styles.ticketDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
              {ticket.event.title}
            </Text>
            <View style={styles.eventMeta}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.eventMetaText, { color: colors.textSecondary }]}>
                {format(new Date(ticket.event.startDate), 'EEE, MMM d · h:mm a')}
              </Text>
            </View>
          </Card>

          {/* Warning */}
          <View style={[styles.warningCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="warning-outline" size={20} color="#D97706" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Important</Text>
              <Text style={styles.warningText}>
                Once the recipient accepts the transfer, you will no longer have access to this ticket.
                This action cannot be undone.
              </Text>
            </View>
          </View>

          {/* Transfer Form */}
          <View style={styles.form}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Recipient Details</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Email Address <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: emailError ? colors.error : colors.border,
                  },
                ]}
              >
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="recipient@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={recipientEmail}
                  onChangeText={(text) => {
                    setRecipientEmail(text);
                    setEmailError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {emailError && (
                <Text style={[styles.errorText, { color: colors.error }]}>{emailError}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Recipient Name <Text style={{ color: colors.textSecondary }}>(optional)</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textSecondary}
                  value={recipientName}
                  onChangeText={setRecipientName}
                  autoCapitalize="words"
                />
              </View>
              <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                This name will appear on the transferred ticket
              </Text>
            </View>
          </View>

          {/* Transfer Button */}
          <Button
            title={transferMutation.isPending ? 'Transferring...' : 'Transfer Ticket'}
            onPress={handleTransfer}
            disabled={transferMutation.isPending || !recipientEmail.trim()}
            style={styles.transferButton}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  ticketSummary: {
    marginBottom: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: '600',
  },
  ticketNumber: {
    fontSize: 13,
    marginTop: 2,
  },
  ticketDivider: {
    height: 1,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: 13,
  },
  warningCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  form: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
  transferButton: {
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
