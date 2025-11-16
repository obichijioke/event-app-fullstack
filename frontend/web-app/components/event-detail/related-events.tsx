import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@/components/ui';
import { EventCard } from '@/components/homepage/event-card';
import type { EventSummary } from '@/lib/homepage';
import { cn } from '@/lib/utils';

export function RelatedEvents({ events }: { events: EventSummary[] }) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Heading as="h2" className="text-2xl font-semibold">
            You might also like
          </Heading>
          <Text className="text-sm text-muted-foreground">
            Discover more curated experiences from our community.
          </Text>
        </div>
        <Link
          href="/events"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Browse all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} compact />
        ))}
      </div>
    </section>
  );
}
