import { EventCard } from '@/components/homepage/event-card';
import type { EventSummary } from '@/lib/homepage';
import { Text } from '@/components/ui';
import Link from 'next/link';

export function EventsGrid({ events }: { events: EventSummary[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <Text className="text-lg text-muted-foreground">
          No events match your filters yet. Try adjusting your search or{' '}
          <Link href="/organizer/onboarding" className="text-primary underline-offset-4 hover:underline">
            create your own event
          </Link>
          .
        </Text>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
