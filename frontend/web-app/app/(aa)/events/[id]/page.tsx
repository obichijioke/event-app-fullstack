import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchEventById, fetchEventDetailData } from '@/lib/events';
import {
  EventHero,
  RelatedEvents,
  QuickInfoCards,
  EventSidebar,
  EventContentTabs,
} from '@/components/event-detail';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const event = await fetchEventDetailData(id);
    return {
      title: `${event.summary.title} | EventFlow`,
      description: event.description.slice(0, 160) || 'View event details, tickets, and venue information.',
    };
  } catch {
    return {
      title: 'Event not found',
    };
  }
}

export default async function EventDetailsPage({ params }: Props) {
  const { id } = await params;

  let data;
  try {
    data = await fetchEventById(id);
  } catch (error) {
    console.error('[events] Failed to load detail', error);
    notFound();
  }

  if (!data) {
    notFound();
  }

  const { event, related } = data;
  const { summary, description, occurrences, tickets, policies, assets } = event;
  const primaryOccurrence = occurrences[0];

  const eventUrl = typeof window !== 'undefined' ? window.location.href : `https://eventflow.ng/events/${summary.id}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <EventHero
        summary={summary}
        occurrenceStart={primaryOccurrence?.startsAt}
        eventUrl={eventUrl}
        eventDescription={description}
      />

      {/* Quick Info Cards */}
      <QuickInfoCards venue={summary.venue} stats={summary.stats} />

      {/* Tab Navigation & Content with Sidebar */}
      <EventContentTabs
        description={description}
        assets={assets}
        summary={summary}
        occurrences={occurrences}
        policies={policies}
        tickets={tickets}
        sidebar={
          <EventSidebar
            eventId={summary.id}
            venue={summary.venue}
            startsAt={primaryOccurrence?.startsAt || summary.startAt}
            endsAt={primaryOccurrence?.endsAt || summary.endAt}
            gateOpenAt={primaryOccurrence?.gateOpenAt}
            timezone={summary.venue?.timezone}
            tickets={tickets}
            organizer={summary.organization}
            eventTitle={summary.title}
            eventDescription={description}
            eventUrl={typeof window !== 'undefined' ? window.location.href : `https://eventflow.ng/events/${summary.id}`}
          />
        }
      />

      {/* Related Events */}
      <div className="container mx-auto px-6 pb-16">
        <RelatedEvents events={related} />
      </div>
    </div>
  );
}
