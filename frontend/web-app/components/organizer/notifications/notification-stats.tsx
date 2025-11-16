'use client';

import { useEffect, useState } from 'react';
import { organizerApi } from '@/lib/api/organizer-api';
import { CategoryStats, NotificationCategory } from '@/lib/types/organizer';
import { Loader2 } from 'lucide-react';

const CATEGORY_INFO: Record<NotificationCategory, { label: string; icon: string; color: string }> = {
  order: {
    label: 'Orders',
    icon: '💰',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  event: {
    label: 'Events',
    icon: '🎉',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  payout: {
    label: 'Payouts',
    icon: '💵',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  moderation: {
    label: 'Moderation',
    icon: '⚠️',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  ticket: {
    label: 'Tickets',
    icon: '🎫',
    color: 'bg-pink-100 text-pink-800 border-pink-300',
  },
  system: {
    label: 'System',
    icon: '⚙️',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  marketing: {
    label: 'Marketing',
    icon: '📢',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
};

interface NotificationStatsProps {
  onCategoryClick?: (category: NotificationCategory) => void;
}

export function NotificationStats({ onCategoryClick }: NotificationStatsProps) {
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await organizerApi.notifications.getCategoryStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load category stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);
  const totalUnread = stats.reduce((sum, stat) => sum + stat.unreadCount, 0);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Notification Overview
        </h3>
        <p className="text-sm text-muted-foreground">
          {totalCount} total notifications • {totalUnread} unread
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stats.map((stat) => {
          const info = CATEGORY_INFO[stat.category as NotificationCategory];
          const hasUnread = stat.unreadCount > 0;

          return (
            <button
              key={stat.category}
              onClick={() => onCategoryClick?.(stat.category as NotificationCategory)}
              className={`relative p-4 rounded-lg border transition-all hover:scale-105 ${
                hasUnread
                  ? 'bg-primary/5 border-primary/30 ring-2 ring-primary/20'
                  : 'bg-background border-border hover:bg-muted/50'
              }`}
            >
              {/* Unread Badge */}
              {hasUnread && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {stat.unreadCount > 9 ? '9+' : stat.unreadCount}
                </div>
              )}

              {/* Icon */}
              <div className="text-3xl mb-2">{info.icon}</div>

              {/* Label */}
              <div className="text-xs font-medium text-foreground mb-1">
                {info.label}
              </div>

              {/* Count */}
              <div className="text-sm text-muted-foreground">
                {stat.count} total
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
