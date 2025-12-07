import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { accountApi } from '@/lib/api';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  hasPermission: boolean;
  isLoading: boolean;
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  // Register for push notifications and get token
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setHasPermission(false);
        return null;
      }

      setHasPermission(true);

      // Get push token
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      const token = tokenResponse.data;
      setExpoPushToken(token);

      // Register token with backend
      try {
        await accountApi.registerPushToken({
          token,
          platform: Platform.OS,
          deviceType: Device.deviceType?.toString() || 'unknown',
        });
      } catch (error) {
        console.error('Failed to register push token with backend:', error);
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563EB',
        });

        await Notifications.setNotificationChannelAsync('event-reminders', {
          name: 'Event Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          description: 'Reminders for upcoming events',
        });

        await Notifications.setNotificationChannelAsync('order-updates', {
          name: 'Order Updates',
          importance: Notifications.AndroidImportance.HIGH,
          description: 'Updates about your orders',
        });

        await Notifications.setNotificationChannelAsync('marketing', {
          name: 'Promotions & Offers',
          importance: Notifications.AndroidImportance.DEFAULT,
          description: 'Promotional messages and special offers',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }, []);

  // Request permission explicitly
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      Alert.alert(
        'Physical Device Required',
        'Push notifications are only available on physical devices.'
      );
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      setHasPermission(true);
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();

    if (status === 'granted') {
      setHasPermission(true);
      await registerForPushNotifications();
      return true;
    }

    if (status === 'denied') {
      Alert.alert(
        'Notifications Disabled',
        'Please enable push notifications in your device settings to receive updates about your events and tickets.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Notifications.openSettingsAsync(),
          },
        ]
      );
    }

    setHasPermission(false);
    return false;
  }, [registerForPushNotifications]);

  // Unregister push token
  const unregisterPushToken = useCallback(async () => {
    if (expoPushToken) {
      try {
        await accountApi.unregisterPushToken(expoPushToken);
        setExpoPushToken(null);
      } catch (error) {
        console.error('Failed to unregister push token:', error);
      }
    }
  }, [expoPushToken]);

  // Handle notification response (when user taps on notification)
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;

      if (data) {
        // Navigate based on notification type
        if (data.eventId) {
          router.push(`/events/${data.eventId}` as const);
        } else if (data.ticketId) {
          router.push(`/tickets/${data.ticketId}` as const);
        } else if (data.orderId) {
          router.push(`/orders/confirmation/${data.orderId}` as const);
        } else if (data.transferId) {
          router.push('/account/transfers');
        } else if (data.screen) {
          router.push(data.screen as const);
        } else {
          // Default: open notifications screen
          router.push('/notifications');
        }
      }
    },
    []
  );

  // Schedule a local notification
  const scheduleLocalNotification = useCallback(
    async (
      title: string,
      body: string,
      data?: Record<string, unknown>,
      trigger?: Notifications.NotificationTriggerInput
    ) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: trigger || null, // null = immediate
      });
    },
    []
  );

  // Get badge count
  const getBadgeCount = useCallback(async (): Promise<number> => {
    return await Notifications.getBadgeCountAsync();
  }, []);

  // Set badge count
  const setBadgeCount = useCallback(async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  }, []);

  useEffect(() => {
    // Initialize push notifications
    const initPushNotifications = async () => {
      setIsLoading(true);

      // Check permissions
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status === 'granted') {
        await registerForPushNotifications();
      }

      setIsLoading(false);
    };

    initPushNotifications();

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for user interaction with notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [registerForPushNotifications, handleNotificationResponse]);

  return {
    expoPushToken,
    notification,
    hasPermission,
    isLoading,
    requestPermission,
    registerForPushNotifications,
    unregisterPushToken,
    scheduleLocalNotification,
    getBadgeCount,
    setBadgeCount,
    clearAllNotifications,
  };
}

// Utility function to send a test notification
export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'This is a test push notification from EventFlow!',
      data: { type: 'test' },
    },
    trigger: null,
  });
}
