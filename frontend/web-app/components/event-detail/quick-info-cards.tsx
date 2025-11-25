'use client';

import { useEffect, useState } from 'react';
import { LocationIcon, UsersIcon, StarIcon } from '@/components/ui/icons';
import type { EventSummary } from '@/lib/homepage';
import type { EventDetailSummary } from '@/lib/events';
import { fetchEventReviewsSummary, ReviewsSummary } from '@/lib/events';

interface QuickInfoCardsProps {
  eventId: string;
  venue: EventSummary['venue'];
  stats: EventSummary['stats'];
  tickets: EventDetailSummary['tickets'];
}

export function QuickInfoCards({ eventId, venue, stats, tickets }: QuickInfoCardsProps) {
  const [reviewSummary, setReviewSummary] = useState<ReviewsSummary | null>(null);

  useEffect(() => {
    fetchEventReviewsSummary(eventId).then(setReviewSummary);
  }, [eventId]);

  const venueName = venue?.name || 'TBA';
  const venueLocation = [venue?.city, venue?.region]
    .filter(Boolean)
    .join(', ') || 'Location TBA';

  // Calculate real ticket availability
  const attendeesCount = stats.orderCount || 0;
  const totalCapacity = tickets.reduce((sum, ticket) => sum + (ticket.capacity || 0), 0);
  // Assuming sold tickets are tracked in stats; otherwise we'd need to fetch this separately
  const ticketsLeft = totalCapacity > 0 ? totalCapacity - attendeesCount : 0;

  // Use real review data
  const rating = reviewSummary?.averageRating || 0;
  const reviewCount = reviewSummary?.totalReviews || 0;

  return (
    <section className="border-b border-border bg-background">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Location Card */}
          <div className="flex items-start gap-4 p-6">
            <div className="flex-shrink-0 w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
              <LocationIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Location
              </p>
              <p className="text-base font-semibold text-foreground">{venueName}</p>
              <p className="text-sm text-muted-foreground">{venueLocation}</p>
            </div>
          </div>

          {/* Attendees Card */}
          <div className="flex items-start gap-4 p-6">
            <div className="flex-shrink-0 w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Attendees
              </p>
              <p className="text-base font-semibold text-foreground">
                {attendeesCount.toLocaleString()} going
              </p>
              <p className="text-sm text-muted-foreground">
                {ticketsLeft.toLocaleString()} tickets left
              </p>
            </div>
          </div>

          {/* Rating Card */}
          <div className="flex items-start gap-4 p-6">
            <div className="flex-shrink-0 w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
              <StarIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Rating
              </p>
              {reviewCount > 0 ? (
                <>
                  <p className="text-base font-semibold text-foreground">{rating.toFixed(1)} ★</p>
                  <p className="text-sm text-muted-foreground">
                    {reviewCount.toLocaleString()} review{reviewCount !== 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-foreground">No ratings yet</p>
                  <p className="text-sm text-muted-foreground">Be the first to review</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

