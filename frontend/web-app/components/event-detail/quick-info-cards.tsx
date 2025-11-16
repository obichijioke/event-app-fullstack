import { LocationIcon, UsersIcon, StarIcon } from '@/components/ui/icons';
import type { EventSummary } from '@/lib/homepage';

interface QuickInfoCardsProps {
  venue: EventSummary['venue'];
  stats: EventSummary['stats'];
}

export function QuickInfoCards({ venue, stats }: QuickInfoCardsProps) {
  const venueName = venue?.name || 'TBA';
  const venueLocation = [venue?.city, venue?.region]
    .filter(Boolean)
    .join(', ') || 'Location TBA';

  // Mock data for attendees and rating - replace with real data when available
  const attendeesCount = stats.orderCount || 0;
  const ticketsLeft = 1479; // This should come from actual ticket availability
  const rating = 4.8;
  const reviewCount = 324;

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
              <p className="text-base font-semibold text-foreground">{rating} ★</p>
              <p className="text-sm text-muted-foreground">
                {reviewCount.toLocaleString()} reviews
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

