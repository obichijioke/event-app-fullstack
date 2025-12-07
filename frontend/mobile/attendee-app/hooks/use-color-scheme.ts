import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore, ThemeMode } from '@/lib/stores/theme-store';

// Custom hook that respects user preference
export function useColorScheme(): ColorSchemeName {
  const systemColorScheme = useRNColorScheme();
  const { mode, isInitialized } = useThemeStore();
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    mode === 'system' ? systemColorScheme : mode
  );

  useEffect(() => {
    if (mode === 'system') {
      setColorScheme(systemColorScheme);
    } else {
      setColorScheme(mode);
    }
  }, [mode, systemColorScheme]);

  // Listen for system appearance changes when in system mode
  useEffect(() => {
    if (mode !== 'system') return;

    const subscription = Appearance.addChangeListener(({ colorScheme: newScheme }) => {
      setColorScheme(newScheme);
    });

    return () => subscription.remove();
  }, [mode]);

  return colorScheme;
}

// Hook to get theme mode and setter
export function useThemeMode(): {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  effectiveColorScheme: ColorSchemeName;
} {
  const { mode, setMode } = useThemeStore();
  const effectiveColorScheme = useColorScheme();

  return {
    mode,
    setMode,
    effectiveColorScheme,
  };
}
