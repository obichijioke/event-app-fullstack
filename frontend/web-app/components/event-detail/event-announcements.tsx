'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Megaphone, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchEventAnnouncements,
  EventAnnouncement,
  trackAnnouncementView,
  dismissAnnouncement,
  getDismissedAnnouncements,
} from '@/lib/events';

interface EventAnnouncementsProps {
  eventId: string;
  className?: string;
  userToken?: string | null;
}

export function EventAnnouncements({ eventId, className, userToken }: EventAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Load announcements
      const data = await fetchEventAnnouncements(eventId);
      setAnnouncements(data);

      // Load dismissed announcements if user is logged in
      if (userToken) {
        const dismissedIds = await getDismissedAnnouncements(eventId, userToken);
        setDismissed(new Set(dismissedIds));

        // Track views for all visible announcements
        for (const announcement of data) {
          if (!dismissedIds.includes(announcement.id)) {
            await trackAnnouncementView(announcement.id, userToken);
          }
        }
      } else {
        // For guest users, check localStorage
        const localDismissed = localStorage.getItem(`dismissed-announcements-${eventId}`);
        if (localDismissed) {
          setDismissed(new Set(JSON.parse(localDismissed)));
        }
      }

      setLoading(false);
    }
    loadData();
  }, [eventId, userToken]);

  if (loading) {
    return null;
  }

  if (announcements.length === 0) {
    return null;
  }

  const visibleAnnouncements = announcements.filter((a) => !dismissed.has(a.id));

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  const handleDismiss = async (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));

    if (userToken) {
      // Persist to backend for logged-in users
      await dismissAnnouncement(id, userToken);
    } else {
      // Persist to localStorage for guest users
      const newDismissed = [...dismissed, id];
      localStorage.setItem(`dismissed-announcements-${eventId}`, JSON.stringify(newDismissed));
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {visibleAnnouncements.map((announcement) => (
        <AnnouncementCard
          key={announcement.id}
          announcement={announcement}
          isExpanded={expanded.has(announcement.id)}
          onToggle={() => toggleExpanded(announcement.id)}
          onDismiss={() => handleDismiss(announcement.id)}
        />
      ))}
    </div>
  );
}

interface AnnouncementCardProps {
  announcement: EventAnnouncement;
  isExpanded: boolean;
  onToggle: () => void;
  onDismiss: () => void;
}

function AnnouncementCard({ announcement, isExpanded, onToggle, onDismiss }: AnnouncementCardProps) {
  const typeStyles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-100',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-600 dark:text-amber-400',
      title: 'text-amber-900 dark:text-amber-100',
    },
    important: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-100',
    },
    urgent: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-100',
    },
  };

  const style = typeStyles[announcement.type];
  const timeAgo = formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true });
  const Icon = announcement.type === 'important' || announcement.type === 'urgent' ? AlertCircle : Megaphone;

  const shortMessage = announcement.message.slice(0, 100);
  const needsTruncation = announcement.message.length > 100;

  return (
    <div className={cn('rounded-lg border p-4 transition-all', style.bg, style.border)}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={cn('h-5 w-5', style.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className={cn('font-semibold text-sm', style.title)}>{announcement.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
            </div>
            <button onClick={onDismiss} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors" aria-label="Dismiss announcement">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="text-sm text-foreground leading-relaxed">
            {isExpanded || !needsTruncation ? <p>{announcement.message}</p> : <p>{shortMessage}...</p>}
            {needsTruncation && (
              <button onClick={onToggle} className="flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline">
                {isExpanded ? (<>Show less <ChevronUp className="h-3 w-3" /></>) : (<>Read more <ChevronDown className="h-3 w-3" /></>)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
