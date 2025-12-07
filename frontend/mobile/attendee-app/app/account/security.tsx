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
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/auth-store';
import { accountApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SecurityScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      accountApi.changePassword({
        currentPassword,
        newPassword,
      }),
    onSuccess: () => {
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to change password');
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Current password is required');
      return;
    }
    if (!newPassword) {
      Alert.alert('Error', 'New password is required');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    changePasswordMutation.mutate();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirm Deletion',
              'Enter your password to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async (password: string | undefined) => {
                    if (password) {
                      try {
                        await accountApi.requestAccountDeletion(password);
                        Alert.alert(
                          'Account Scheduled for Deletion',
                          'Your account will be deleted within 30 days. You can cancel this by logging in again.'
                        );
                      } catch (error) {
                        Alert.alert('Error', 'Failed to delete account. Please check your password.');
                      }
                    }
                  },
                },
              ],
              'secure-text'
            );
          },
        },
      ]
    );
  };

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Security</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Password Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Password</Text>
          <Card style={styles.section}>
            {!showPasswordForm ? (
              <TouchableOpacity
                style={styles.passwordRow}
                onPress={() => setShowPasswordForm(true)}
              >
                <View style={styles.passwordInfo}>
                  <Ionicons name="lock-closed-outline" size={24} color={colors.tint} />
                  <View style={styles.passwordText}>
                    <Text style={[styles.passwordLabel, { color: colors.text }]}>
                      Change Password
                    </Text>
                    <Text style={[styles.passwordHint, { color: colors.textSecondary }]}>
                      Last changed: Unknown
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.passwordForm}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Current Password</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showCurrentPassword}
                    />
                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                      <Ionicons
                        name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                      <Ionicons
                        name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.buttonRow}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    style={styles.cancelButton}
                  />
                  <Button
                    title={changePasswordMutation.isPending ? 'Saving...' : 'Save'}
                    onPress={handleChangePassword}
                    disabled={changePasswordMutation.isPending}
                    style={styles.saveButton}
                  />
                </View>
              </View>
            )}
          </Card>

          {/* Two-Factor Authentication */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Two-Factor Authentication</Text>
          <Card style={styles.section}>
            <View style={styles.twoFactorRow}>
              <View style={styles.twoFactorInfo}>
                <View
                  style={[
                    styles.twoFactorIcon,
                    { backgroundColor: user?.twoFactorEnabled ? '#D1FAE5' : colors.tint + '15' },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={24}
                    color={user?.twoFactorEnabled ? '#059669' : colors.tint}
                  />
                </View>
                <View style={styles.twoFactorText}>
                  <Text style={[styles.twoFactorLabel, { color: colors.text }]}>
                    2FA {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                  <Text style={[styles.twoFactorHint, { color: colors.textSecondary }]}>
                    {user?.twoFactorEnabled
                      ? 'Your account is protected with 2FA'
                      : 'Add an extra layer of security'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.twoFactorButton,
                  {
                    backgroundColor: user?.twoFactorEnabled ? colors.error + '15' : colors.tint,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.twoFactorButtonText,
                    { color: user?.twoFactorEnabled ? colors.error : '#FFFFFF' },
                  ]}
                >
                  {user?.twoFactorEnabled ? 'Disable' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Active Sessions */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sessions</Text>
          <Card style={styles.section}>
            <TouchableOpacity
              style={styles.sessionRow}
              onPress={() => router.push('/account/sessions')}
            >
              <View style={styles.sessionInfo}>
                <Ionicons name="phone-portrait-outline" size={24} color={colors.tint} />
                <View style={styles.sessionText}>
                  <Text style={[styles.sessionLabel, { color: colors.text }]}>
                    Active Sessions
                  </Text>
                  <Text style={[styles.sessionHint, { color: colors.textSecondary }]}>
                    Manage devices logged into your account
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </Card>

          {/* Danger Zone */}
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          <Card style={{ ...styles.section, borderColor: colors.error, borderWidth: 1 }}>
            <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAccount}>
              <View style={styles.dangerInfo}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
                <View style={styles.dangerText}>
                  <Text style={[styles.dangerLabel, { color: colors.error }]}>
                    Delete Account
                  </Text>
                  <Text style={[styles.dangerHint, { color: colors.textSecondary }]}>
                    Permanently delete your account and all data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            </TouchableOpacity>
          </Card>

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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  passwordText: {
    flex: 1,
  },
  passwordLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  passwordHint: {
    fontSize: 13,
  },
  passwordForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  twoFactorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  twoFactorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  twoFactorIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoFactorText: {
    flex: 1,
  },
  twoFactorLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  twoFactorHint: {
    fontSize: 13,
  },
  twoFactorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  twoFactorButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  sessionText: {
    flex: 1,
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  sessionHint: {
    fontSize: 13,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  dangerText: {
    flex: 1,
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  dangerHint: {
    fontSize: 13,
  },
});
