import Link from 'next/link';
import { DashboardEvent } from '@/lib/types/organizer';

interface EventItemProps {
  event: DashboardEvent;
}

export function EventItem({ event }: EventItemProps) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    live: 'bg-green-100 text-green-800 border-green-200',
    paused: 'bg-orange-100 text-orange-800 border-orange-200',
    canceled: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <Link
      href={`/organizer/events/${event.id}`}
      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <p className="font-medium text-foreground truncate">{event.title}</p>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded border ${
              statusColors[event.status]
            }`}
          >
            {event.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(event.startAt).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </Link>
  );
}
