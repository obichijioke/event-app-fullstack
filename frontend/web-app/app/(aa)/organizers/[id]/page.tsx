import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { fetchOrganizerById } from '@/lib/organizers';
import { Heading, Text, Badge, buttonVariants } from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const organizer = await fetchOrganizerById(id);

  if (!organizer) {
    return {
      title: 'Organizer Not Found',
      description: 'The requested organizer could not be found.',
    };
  }

  return {
    title: `${organizer.name} - Event Organizer`,
    description: `View upcoming events from ${organizer.name} and follow for updates`,
  };
}

export default async function OrganizerProfilePage({ params }: Props) {
  const { id } = await params;
  const organizer = await fetchOrganizerById(id);

  if (!organizer) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      {/* Organizer Header */}
      <header className="mb-10">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Logo placeholder */}
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
              <span className="text-3xl font-bold text-primary">
                {organizer.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Organizer info */}
            <div className="flex-1">
              <div className="mb-4">
                <Heading as="h1" className="mb-2 text-3xl font-bold lg:text-4xl">
                  {organizer.name}
                </Heading>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {organizer.country && (
                    <span className="flex items-center gap-1">
                      🌍 {organizer.country}
                    </span>
                  )}
                  {organizer.website && (
                    <a
                      href={organizer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit website →
                    </a>
                  )}
                </div>
              </div>

              <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                Follow
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-8">
            <div className="text-center">
              <Text className="text-3xl font-bold text-foreground">
                {organizer.eventCount}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Total Events
              </Text>
            </div>
            <div className="text-center">
              <Text className="text-3xl font-bold text-foreground">
                {organizer.followerCount}
              </Text>
              <Text className="text-sm text-muted-foreground">Followers</Text>
            </div>
            <div className="text-center">
              <Text className="text-3xl font-bold text-foreground">
                {organizer.upcomingEvents.length}
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
          {organizer.upcomingEvents.length > 0 && (
            <Badge variant="outline" size="sm">
              {organizer.upcomingEvents.length} event
              {organizer.upcomingEvents.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {organizer.upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {organizer.upcomingEvents.map((event) => {
              const venueLine = event.venue?.name || 'Venue TBA';
              return (
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{venueLine}</span>
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
              );
            })}
          </div>
        ) : (
          <EmptyState organizerName={organizer.name} />
        )}
      </section>
    </div>
  );
}

function EmptyState({ organizerName }: { organizerName: string }) {
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
            {organizerName} doesn&apos;t have any upcoming events at the moment.
            Follow them to get notified when new events are announced.
          </Text>
        </div>
        <div className="flex justify-center gap-4">
          <Link
            href="/organizers"
            className="inline-flex rounded-lg border border-border bg-card px-6 py-2 text-sm font-medium text-foreground transition hover:border-primary/50"
          >
            Browse Organizers
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
