import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DisputesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const webDashboardUrl = process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://eventflow.app';

  const handleOpenWeb = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(webDashboardUrl);
      if (supported) {
        await Linking.openURL(webDashboardUrl);
      } else {
        Alert.alert('Unable to open link', 'Please visit the dashboard from your browser.');
      }
    } catch {
      Alert.alert('Unable to open link', 'Please visit the dashboard from your browser.');
    }
  }, [webDashboardUrl]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="shield-outline" size={36} color={colors.tint} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Disputes</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Buyer dispute management is coming soon to the mobile app. In the meantime you can view
            and respond to disputes from the web experience.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, { borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Why here?</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Notifications and links about disputes point to this screen so you have a clear
                landing place while we finalize the mobile workflows.
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <Ionicons name="globe-outline" size={24} color={colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Need to act now?</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Open EventFlow on web to upload evidence or reply to dispute threads without delay.
              </Text>
            </View>
          </View>
        </View>

        <Button
          title="Go to Home"
          onPress={() => router.replace('/(tabs)')}
          fullWidth
          style={styles.button}
        />
        <Button
          title="Open web dashboard"
          variant="outline"
          onPress={handleOpenWeb}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  backButton: {
    paddingVertical: 4,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 4,
  },
});
