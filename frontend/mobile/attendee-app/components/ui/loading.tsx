import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LoadingProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ size = 'large', message, fullScreen = false }: LoadingProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const content = (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.tint} />
      {message && (
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
        {content}
      </View>
    );
  }

  return content;
}

export function LoadingOverlay({ message }: { message?: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.overlay}>
      <View style={[styles.overlayContent, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        {message && (
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
});
