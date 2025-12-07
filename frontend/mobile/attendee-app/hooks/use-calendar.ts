import { useState, useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as Calendar from 'expo-calendar';
import type { Event } from '@/lib/types';

export function useCalendar() {
  const [isAdding, setIsAdding] = useState(false);

  const getDefaultCalendar = async (): Promise<string | null> => {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    // Try to find the default calendar
    const defaultCalendar = calendars.find(
      (cal) =>
        cal.allowsModifications &&
        (cal.isPrimary ||
          cal.source.name === 'iCloud' ||
          cal.source.name === 'Google' ||
          cal.accessLevel === Calendar.CalendarAccessLevel.OWNER)
    );

    if (defaultCalendar) {
      return defaultCalendar.id;
    }

    // Fall back to any modifiable calendar
    const modifiableCalendar = calendars.find((cal) => cal.allowsModifications);
    return modifiableCalendar?.id || null;
  };

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Calendar Permission Required',
        'Please allow calendar access to add events to your calendar.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return false;
    }

    return true;
  };

  const addEventToCalendar = useCallback(async (event: Event): Promise<boolean> => {
    setIsAdding(true);

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setIsAdding(false);
        return false;
      }

      const calendarId = await getDefaultCalendar();
      if (!calendarId) {
        Alert.alert('Error', 'Could not find a calendar to add the event to.');
        setIsAdding(false);
        return false;
      }

      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      // Build location string
      let location = '';
      if (event.venue) {
        location = event.venue.name;
        if (event.venue.address) {
          location += `, ${event.venue.address}`;
        }
        if (event.venue.city) {
          location += `, ${event.venue.city}`;
        }
      }

      // Build notes/description
      let notes = event.shortDescription || event.description || '';
      if (event.organization) {
        notes += `\n\nOrganized by: ${event.organization.name}`;
      }

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: event.title,
        startDate,
        endDate,
        location,
        notes,
        timeZone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [
          { relativeOffset: -60 }, // 1 hour before
          { relativeOffset: -1440 }, // 1 day before
        ],
      });

      if (eventId) {
        Alert.alert(
          'Added to Calendar',
          `"${event.title}" has been added to your calendar with reminders.`,
          [{ text: 'OK' }]
        );
        setIsAdding(false);
        return true;
      }

      setIsAdding(false);
      return false;
    } catch (error) {
      console.error('Failed to add event to calendar:', error);
      Alert.alert('Error', 'Failed to add event to calendar. Please try again.');
      setIsAdding(false);
      return false;
    }
  }, []);

  const checkIfEventInCalendar = useCallback(async (event: Event): Promise<boolean> => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      // Search for events with the same title in the time range
      const existingEvents = await Calendar.getEventsAsync(
        [(await getDefaultCalendar()) || ''],
        startDate,
        endDate
      );

      return existingEvents.some((e) => e.title === event.title);
    } catch {
      return false;
    }
  }, []);

  return {
    addEventToCalendar,
    checkIfEventInCalendar,
    isAdding,
  };
}
