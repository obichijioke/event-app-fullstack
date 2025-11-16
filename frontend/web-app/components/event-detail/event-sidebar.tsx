import { DateTimeCard } from './date-time-card';
import { VenueCard } from './venue-card';
import { TicketPricingCard } from './ticket-pricing-card';
import { EventOrganizerCard } from './event-organizer-card';
import type { EventSummary } from '@/lib/homepage';
import type { EventDetailSummary } from '@/lib/events';

interface EventSidebarProps {
  eventId: string;
  venue: EventSummary['venue'];
  startsAt: string;
  endsAt?: string | null;
  gateOpenAt?: string | null;
  timezone?: string | null;
  tickets: EventDetailSummary['tickets'];
  organizer: EventSummary['organization'];
  eventTitle?: string;
  eventDescription?: string;
  eventUrl?: string;
}

export function EventSidebar({
  eventId,
  venue,
  startsAt,
  endsAt,
  gateOpenAt,
  timezone,
  tickets,
  organizer,
  eventTitle,
  eventDescription,
  eventUrl,
}: EventSidebarProps) {
  const venueName = venue?.name || '';
  const venueLocation = [
    (venue as any)?.address,
    (venue as any)?.city,
    (venue as any)?.region,
    (venue as any)?.country
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Date, Venue & Tickets Card */}
      <div className="rounded border border-border bg-card p-6">
        <DateTimeCard
          startsAt={startsAt}
          endsAt={endsAt}
          gateOpenAt={gateOpenAt}
          timezone={timezone}
          eventTitle={eventTitle}
          eventDescription={eventDescription}
          eventLocation={venueName ? `${venueName}, ${venueLocation}` : venueLocation}
          eventUrl={eventUrl}
        />
        <VenueCard venue={venue ?? null} />
        <TicketPricingCard eventId={eventId} tickets={tickets} />
      </div>

      {/* Event Organizer Card */}
      <EventOrganizerCard organizer={organizer} />
    </div>
  );
}

