'use client';

import * as React from 'react';
import { Text, Badge, Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'user' | 'event' | 'order' | 'payment' | 'system';
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

const activityConfig = {
  user: {
    icon: <UsersIcon className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  event: {
    icon: <CalendarIcon className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  order: {
    icon: <ShoppingCartIcon className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  payment: {
    icon: <CurrencyIcon className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  system: {
    icon: <SettingsIcon className="h-4 w-4" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  const [showAll, setShowAll] = React.useState(false);
  const displayActivities = showAll ? activities : activities.slice(0, 10);

  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Text className="text-lg font-semibold text-foreground">Recent Activity</Text>
          {activities.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-primary hover:underline"
            >
              {showAll ? 'Show Less' : 'Show All'}
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {displayActivities.length === 0 ? (
          <div className="p-8 text-center">
            <Text className="text-muted-foreground">No recent activity</Text>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: ActivityItem }) {
  const config = activityConfig[activity.type];

  return (
    <div className="p-4 hover:bg-muted/50 transition-colors">
      <div className="flex gap-3">
        {/* Activity icon */}
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', config.bgColor)}>
          <div className={config.color}>
            {config.icon}
          </div>
        </div>

        {/* Activity content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Text className="text-sm font-medium text-foreground">
              {activity.title}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {formatDate(activity.timestamp, 'time')}
            </Text>
          </div>

          <Text className="mt-1 text-sm text-muted-foreground">
            {activity.description}
          </Text>

          {/* User info */}
          {activity.userName && (
            <div className="mt-2 flex items-center gap-2">
              <Avatar name={activity.userName} size="sm" />
              <Text className="text-xs text-muted-foreground">
                {activity.userName}
              </Text>
            </div>
          )}

          {/* Metadata badges */}
          {activity.metadata && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(activity.metadata).map(([key, value]) => (
                <Badge key={key} variant="secondary" size="sm">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon Components
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M21 3h2l.4 2M7 13l-4 8h2.6M10 11l2-2m-2 2l-2-2"
      />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 00-1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}