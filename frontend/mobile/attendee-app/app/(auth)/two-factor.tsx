import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/auth-store';

const CODE_LENGTH = 6;

export default function TwoFactorScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { verify2FA, isLoading, error, clearError, requires2FA } = useAuthStore();

  // Redirect if not in 2FA flow
  useEffect(() => {
    if (!requires2FA) {
      router.replace('/(auth)/login');
    }
  }, [requires2FA]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear error when code changes
  useEffect(() => {
    if (error) clearError();
  }, [code]);

  const handleCodeChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= CODE_LENGTH) {
      setCode(numericValue);
    }
  };

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) return;

    const success = await verify2FA(code);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      handleVerify();
    }
  }, [code]);

  const handleBack = () => {
    clearError();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Back Button */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
              <Ionicons name="shield-checkmark-outline" size={32} color={colors.tint} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Two-factor authentication</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code from your authenticator app
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Code Input */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={styles.codeContainer}
          >
            {Array.from({ length: CODE_LENGTH }).map((_, index) => {
              const digit = code[index];
              const isFilled = digit !== undefined;
              const isActive = index === code.length;

              return (
                <View
                  key={index}
                  style={[
                    styles.codeBox,
                    {
                      borderColor: error
                        ? colors.error
                        : isActive
                        ? colors.tint
                        : colors.border,
                      backgroundColor: isFilled
                        ? colors.backgroundSecondary
                        : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.codeDigit, { color: colors.text }]}>
                    {digit || ''}
                  </Text>
                </View>
              );
            })}
          </TouchableOpacity>

          {/* Hidden Input */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            style={styles.hiddenInput}
            autoFocus
          />

          {/* Submit Button */}
          <Button
            title="Verify"
            onPress={handleVerify}
            loading={isLoading}
            disabled={code.length !== CODE_LENGTH}
            fullWidth
            style={styles.button}
          />

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Open your authenticator app (like Google Authenticator or Authy) to view your
              verification code.
            </Text>
          </View>

          {/* Recovery */}
          <TouchableOpacity style={styles.recoveryLink}>
            <Text style={[styles.recoveryText, { color: colors.tint }]}>
              Lost access to your authenticator?
            </Text>
          </TouchableOpacity>
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
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDigit: {
    fontSize: 24,
    fontWeight: '600',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  button: {
    marginBottom: 24,
  },
  helpContainer: {
    marginBottom: 24,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  recoveryLink: {
    alignItems: 'center',
  },
  recoveryText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
