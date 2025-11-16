import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { fetchVenueById, getVenueLocation } from '@/lib/venues';
import { Heading, Text, Badge, buttonVariants } from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const venue = await fetchVenueById(id);

  if (!venue) {
    return {
      title: 'Venue Not Found',
      description: 'The requested venue could not be found.',
    };
  }

  const location = getVenueLocation(venue.address);

  return {
    title: `${venue.name} - Event Venue`,
    description: `View upcoming events at ${venue.name} in ${location}`,
  };
}

export default async function VenueDetailPage({ params }: Props) {
  const { id } = await params;
  const venue = await fetchVenueById(id);

  if (!venue) {
    notFound();
  }

  const location = getVenueLocation(venue.address);
  const addressLine1 =
    typeof venue.address.line1 === 'string' ? venue.address.line1 : '';

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      {/* Venue Header */}
      <header className="mb-10">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Venue Icon */}
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
              <svg
                className="h-12 w-12 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>

            {/* Venue Info */}
            <div className="flex-1">
              <div className="mb-4">
                <Heading as="h1" className="mb-3 text-3xl font-bold lg:text-4xl">
                  {venue.name}
                </Heading>

                {/* Location */}
                <div className="mb-2 flex items-start gap-2 text-muted-foreground">
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    {addressLine1 && (
                      <Text className="text-sm">{addressLine1}</Text>
                    )}
                    <Text className="text-sm">{location}</Text>
                  </div>
                </div>

                {/* Timezone */}
                {venue.timezone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{venue.timezone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-8 md:grid-cols-3">
            {venue.capacity && (
              <div className="text-center">
                <Text className="text-3xl font-bold text-foreground">
                  {venue.capacity.toLocaleString()}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Max Capacity
                </Text>
              </div>
            )}
            <div className="text-center">
              <Text className="text-3xl font-bold text-foreground">
                {venue.eventCount}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Total Events
              </Text>
            </div>
            <div className="text-center">
              <Text className="text-3xl font-bold text-foreground">
                {venue.upcomingEvents.length}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Upcoming Events
              </Text>
            </div>
          </div>
        </div>
      </header>

      {/* Upcoming Events */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <Heading as="h2" className="text-2xl font-semibold">
            Upcoming Events
          </Heading>
          {venue.upcomingEvents.length > 0 && (
            <Badge variant="outline" size="sm">
              {venue.upcomingEvents.length} event
              {venue.upcomingEvents.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {venue.upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {venue.upcomingEvents.map((event) => (
              <article
                key={event.id}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
              >
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
                  {event.coverImageUrl ? (
                    <Image
                      src={event.coverImageUrl}
                      alt={event.title}
                      fill
                      className="object-cover transition duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Event Info */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3">
                    <Text className="mb-2 text-sm font-medium text-primary">
                      {formatDate(event.startAt, 'long')}
                    </Text>
                    <Link
                      href={`/events/${event.id}`}
                      className="text-lg font-semibold text-foreground transition hover:text-primary"
                    >
                      {event.title}
                    </Link>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>By {event.organizer.name}</span>
                  </div>

                  <div className="mt-auto">
                    <Link
                      href={`/events/${event.id}`}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        'w-full',
                      )}
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState venueName={venue.name} />
        )}
      </section>
    </div>
  );
}

function EmptyState({ venueName }: { venueName: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <Heading as="h3" className="text-xl font-semibold">
            No upcoming events
          </Heading>
          <Text className="text-muted-foreground">
            {venueName} doesn&apos;t have any upcoming events scheduled at the
            moment. Check back later or explore other venues.
          </Text>
        </div>
        <div className="flex justify-center gap-4">
          <Link
            href="/venues"
            className="inline-flex rounded-lg border border-border bg-card px-6 py-2 text-sm font-medium text-foreground transition hover:border-primary/50"
          >
            Browse Venues
          </Link>
          <Link
            href="/events"
            className="inline-flex rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            All Events
          </Link>
        </div>
      </div>
    </section>
  );
}
