import Link from 'next/link';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { DashboardEvent } from '@/lib/types/organizer';

interface EventCardProps {
  event: DashboardEvent & {
    venue?: { name: string };
    category?: { name: string };
    ticketsSold?: number;
    revenue?: number;
  };
  orgId: string;
}

export function EventCard({ event, orgId }: EventCardProps) {
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
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition">
      <Link href={`/organizer/events/${event.id}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate mb-2">
                {event.title}
              </h3>
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded border ${
                  statusColors[event.status]
                }`}
              >
                {event.status}
              </span>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(event.startAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {event.venue && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{event.venue.name}</span>
              </div>
            )}

            {event.category && (
              <div className="text-sm text-muted-foreground">
                Category: {event.category.name}
              </div>
            )}
          </div>

          {/* Stats */}
          {(event.ticketsSold !== undefined || event.revenue !== undefined) && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              {event.ticketsSold !== undefined && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tickets Sold</p>
                    <p className="text-sm font-semibold text-foreground">
                      {event.ticketsSold}
                    </p>
                  </div>
                </div>
              )}

              {event.revenue !== undefined && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-sm font-semibold text-foreground">
                      ${event.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Quick Actions */}
      <div className="bg-muted/50 px-6 py-3 border-t border-border flex gap-2">
        <Link
          href={`/organizer/events/${event.id}/edit`}
          className="text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Edit
        </Link>
        <Link
          href={`/organizer/events/${event.id}/tickets`}
          className="text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Tickets
        </Link>
        <Link
          href={`/organizer/events/${event.id}/orders`}
          className="text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Orders
        </Link>
      </div>
    </div>
  );
}
