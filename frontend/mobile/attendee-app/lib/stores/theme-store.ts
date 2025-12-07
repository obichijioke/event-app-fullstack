import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isInitialized: boolean;
  setMode: (mode: ThemeMode) => void;
  getEffectiveColorScheme: () => ColorSchemeName;
  initialize: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isInitialized: false,

      setMode: (mode: ThemeMode) => {
        set({ mode });
      },

      getEffectiveColorScheme: (): ColorSchemeName => {
        const { mode } = get();
        if (mode === 'system') {
          return Appearance.getColorScheme() || 'light';
        }
        return mode;
      },

      initialize: () => {
        set({ isInitialized: true });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialize();
        }
      },
    }
  )
);

// Helper function to get current color scheme
export function getColorScheme(): ColorSchemeName {
  return useThemeStore.getState().getEffectiveColorScheme();
}
