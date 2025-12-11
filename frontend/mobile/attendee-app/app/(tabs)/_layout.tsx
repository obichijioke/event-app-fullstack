import { Tabs, router } from 'expo-router';
import React from 'react';
import { Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/lib/stores/auth-store';

type TabIconName = 'home' | 'search' | 'ticket' | 'bookmark' | 'person' | 'log-in';

function TabBarIcon({ name, color, focused }: { name: TabIconName; color: string; focused: boolean }) {
  const iconName = focused ? name : (`${name}-outline` as `${TabIconName}-outline`);
  return (
    <Ionicons
      name={iconName as keyof typeof Ionicons.glyphMap}
      size={24}
      color={color}
    />
  );
}

// Custom tab button that shows login prompt for protected tabs when not authenticated
function ProtectedTabButton(props: any) {
  const { isAuthenticated } = useAuthStore();
  const { children, onPress, accessibilityLabel, ...rest } = props;

  const handlePress = (e: any) => {
    if (!isAuthenticated) {
      e.preventDefault();
      Alert.alert(
        'Login Required',
        `Please log in to access your ${accessibilityLabel?.toLowerCase() || 'content'}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log In',
            onPress: () => router.push('/(auth)/login'),
          },
        ]
      );
    } else {
      onPress?.(e);
    }
  };

  return (
    <HapticTab {...rest} onPress={handlePress} accessibilityLabel={accessibilityLabel}>
      {children}
    </HapticTab>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { isAuthenticated } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* Public tabs - accessible without login */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="search" color={color} focused={focused} />
          ),
        }}
      />

      {/* Protected tabs - require login */}
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="ticket" color={color} focused={focused} />
          ),
          tabBarButton: ProtectedTabButton,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="bookmark" color={color} focused={focused} />
          ),
          tabBarButton: ProtectedTabButton,
        }}
      />

      {/* Profile tab - shows login option when not authenticated */}
      <Tabs.Screen
        name="profile"
        options={{
          title: isAuthenticated ? 'Profile' : 'Log In',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={isAuthenticated ? 'person' : 'log-in'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      {/* Hide the explore tab from the old template */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
