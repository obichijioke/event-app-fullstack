/**
 * Theme colors for the EventFlow attendee app.
 * Supports light and dark mode with a professional, accessible design.
 */

import { Platform } from 'react-native';

// Primary brand color
const primaryLight = '#2563EB'; // Blue 600
const primaryDark = '#3B82F6'; // Blue 500

export const Colors = {
  light: {
    text: '#111827', // Gray 900
    textSecondary: '#6B7280', // Gray 500
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB', // Gray 50
    card: '#FFFFFF',
    tint: primaryLight,
    icon: '#6B7280', // Gray 500
    border: '#E5E7EB', // Gray 200
    tabIconDefault: '#9CA3AF', // Gray 400
    tabIconSelected: primaryLight,
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    error: '#EF4444', // Red 500
    info: '#3B82F6', // Blue 500
  },
  dark: {
    text: '#F9FAFB', // Gray 50
    textSecondary: '#9CA3AF', // Gray 400
    background: '#111827', // Gray 900
    backgroundSecondary: '#1F2937', // Gray 800
    card: '#1F2937', // Gray 800
    tint: primaryDark,
    icon: '#9CA3AF', // Gray 400
    border: '#374151', // Gray 700
    tabIconDefault: '#6B7280', // Gray 500
    tabIconSelected: primaryDark,
    success: '#34D399', // Emerald 400
    warning: '#FBBF24', // Amber 400
    error: '#F87171', // Red 400
    info: '#60A5FA', // Blue 400
  },
};

// Semantic colors (not theme-dependent)
export const SemanticColors = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
