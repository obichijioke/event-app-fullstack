import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; darkBg: string; darkText: string }> = {
  default: { bg: '#E5E7EB', text: '#374151', darkBg: '#374151', darkText: '#E5E7EB' },
  primary: { bg: '#DBEAFE', text: '#1D4ED8', darkBg: '#1E3A8A', darkText: '#93C5FD' },
  success: { bg: '#D1FAE5', text: '#047857', darkBg: '#064E3B', darkText: '#6EE7B7' },
  warning: { bg: '#FEF3C7', text: '#B45309', darkBg: '#78350F', darkText: '#FCD34D' },
  error: { bg: '#FEE2E2', text: '#B91C1C', darkBg: '#7F1D1D', darkText: '#FCA5A5' },
  info: { bg: '#E0E7FF', text: '#4338CA', darkBg: '#312E81', darkText: '#A5B4FC' },
};

export function Badge({ text, variant = 'default', size = 'md', style }: BadgeProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = variantColors[variant];

  const containerStyle: ViewStyle = {
    backgroundColor: colorScheme === 'dark' ? colors.darkBg : colors.bg,
    paddingHorizontal: size === 'sm' ? 6 : 10,
    paddingVertical: size === 'sm' ? 2 : 4,
    borderRadius: size === 'sm' ? 4 : 6,
    alignSelf: 'flex-start',
  };

  const textStyle: TextStyle = {
    color: colorScheme === 'dark' ? colors.darkText : colors.text,
    fontSize: size === 'sm' ? 10 : 12,
    fontWeight: '500',
  };

  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{text}</Text>
    </View>
  );
}

// Status badge helper for tickets/orders
export function StatusBadge({ status }: { status: string }) {
  const getVariant = (): BadgeVariant => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'issued':
      case 'approved':
      case 'live':
      case 'checked_in':
      case 'accepted':
        return 'success';
      case 'pending':
      case 'under_review':
        return 'warning';
      case 'canceled':
      case 'refunded':
      case 'void':
      case 'rejected':
      case 'failed':
        return 'error';
      case 'transferred':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatStatus = (s: string): string => {
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return <Badge text={formatStatus(status)} variant={getVariant()} />;
}
