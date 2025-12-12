import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi, getApiError } from '@/lib/api/auth';

type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [status, setStatus] = useState<VerifyStatus>(token ? 'verifying' : 'idle');
  const [message, setMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Auto-verify when a token is present in the URL/query params
  useEffect(() => {
    if (token && typeof token === 'string') {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (tokenValue: string) => {
    setStatus('verifying');
    setMessage(null);

    try {
      const response = await authApi.verifyEmail(tokenValue);
      setStatus('success');
      setMessage(response.message || 'Your email has been verified.');
    } catch (error) {
      const apiError = getApiError(error);
      setStatus('error');
      setMessage(apiError.message || 'Unable to verify email. Please request a new link.');
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage(null);

    try {
      const response = await authApi.requestEmailVerification();
      setResendMessage(response.message || 'Verification email sent. Please check your inbox.');
    } catch (error) {
      const apiError = getApiError(error);
      setResendMessage(apiError.message || 'Failed to send verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  const iconName =
    status === 'success'
      ? 'checkmark-circle'
      : status === 'error'
      ? 'alert-circle'
      : 'mail-unread';
  const iconColor =
    status === 'success'
      ? '#16A34A'
      : status === 'error'
      ? colors.error
      : colors.tint;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name={iconName} size={40} color={iconColor} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Verify your email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a verification link to your email. Open it to finish setting up your account.
            </Text>
          </View>

          {message && (
            <View style={[styles.messageCard, { backgroundColor: colors.card }]}>
              <Ionicons
                name={status === 'error' ? 'alert-circle' : 'information-circle'}
                size={20}
                color={status === 'error' ? colors.error : colors.tint}
              />
              <Text
                style={[
                  styles.messageText,
                  { color: status === 'error' ? colors.error : colors.text },
                ]}
              >
                {message}
              </Text>
            </View>
          )}

          <Button
            title={
              status === 'success'
                ? 'Continue to app'
                : status === 'verifying'
                ? 'Verifying...'
                : 'I already verified'
            }
            onPress={status === 'success' ? handleContinue : () => token && verifyToken(String(token))}
            loading={status === 'verifying'}
            disabled={status === 'verifying' || (status !== 'success' && !token)}
            fullWidth
            style={styles.primaryButton}
          />

          <Button
            title="Resend verification email"
            variant="outline"
            onPress={handleResend}
            loading={isResending}
            fullWidth
          />

          {resendMessage && (
            <Text style={[styles.resendMessage, { color: colors.textSecondary }]}>
              {resendMessage}
            </Text>
          )}
        </View>
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
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginBottom: 12,
  },
  resendMessage: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
});
