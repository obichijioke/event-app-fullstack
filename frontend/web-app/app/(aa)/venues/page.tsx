import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  fetchVenues,
  searchVenues,
  sortVenues,
  getVenueLocation,
  type VenueSummary,
} from '@/lib/venues';
import { Heading, Text, Badge } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Event Venues',
  description: 'Browse and explore event venues hosting live events',
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const revalidate = 60;

export default async function VenuesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Normalize search params
  const normalizedParams = {
    search: typeof params.search === 'string' ? params.search : undefined,
    sortBy:
      typeof params.sortBy === 'string' &&
      ['name', 'capacity', 'events'].includes(params.sortBy)
        ? (params.sortBy as 'name' | 'capacity' | 'events')
        : 'name',
  };

  // Fetch and filter venues
  let venues = await fetchVenues();

  if (normalizedParams.search) {
    venues = searchVenues(venues, normalizedParams.search);
  }

  venues = sortVenues(venues, normalizedParams.sortBy);

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      {/* Header */}
      <header className="mb-10">
        <Heading as="h1" className="mb-3 text-4xl font-bold lg:text-5xl">
          Event Venues
        </Heading>
        <Text className="max-w-2xl text-base text-muted-foreground lg:text-lg">
          Discover venues hosting live events in your area
        </Text>
      </header>

      {/* Stats & Filters */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Text className="text-sm text-muted-foreground">
            Showing {venues.length} venue{venues.length !== 1 ? 's' : ''}
          </Text>
          {normalizedParams.search && (
            <Badge variant="outline" size="sm">
              Search: {normalizedParams.search}
            </Badge>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Text className="text-sm text-muted-foreground">Sort by:</Text>
          <div className="flex gap-2">
            <SortButton
              label="Name"
              value="name"
              currentSort={normalizedParams.sortBy}
            />
            <SortButton
              label="Capacity"
              value="capacity"
              currentSort={normalizedParams.sortBy}
            />
            <SortButton
              label="Events"
              value="events"
              currentSort={normalizedParams.sortBy}
            />
          </div>
        </div>
      </div>

      {/* Venues Grid */}
      {venues.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      ) : (
        <EmptyState searchQuery={normalizedParams.search} />
      )}
    </div>
  );
}

function SortButton({
  label,
  value,
  currentSort,
}: {
  label: string;
  value: string;
  currentSort: string;
}) {
  const isActive = currentSort === value;

  return (
    <Link
      href={`/venues?sortBy=${value}`}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
        isActive
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:border-primary/50'
      }`}
    >
      {label}
    </Link>
  );
}

function VenueCard({ venue }: { venue: VenueSummary }) {
  const location = getVenueLocation(venue.address);

  return (
    <Link
      href={`/venues/${venue.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
    >
      {venue.imageUrl ? (
        <div className="mb-4 h-40 overflow-hidden rounded-lg border border-border/70">
          <Image
            src={venue.imageUrl}
            alt={venue.name}
            width={640}
            height={320}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="mb-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 text-sm text-muted-foreground">
          Image coming soon
        </div>
      )}
      {/* Venue Header */}
      <div className="mb-4">
        <Heading
          as="h3"
          className="mb-2 text-xl font-semibold text-foreground transition group-hover:text-primary"
        >
          {venue.name}
        </Heading>
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
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{location}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-4">
        {venue.capacity && (
          <div>
            <Text className="text-2xl font-bold text-foreground">
              {venue.capacity.toLocaleString()}
            </Text>
            <Text className="text-xs text-muted-foreground">Capacity</Text>
          </div>
        )}
        <div className={venue.capacity ? '' : 'col-span-2'}>
          <Text className="text-2xl font-bold text-foreground">
            {venue.eventCount}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Live Event{venue.eventCount !== 1 ? 's' : ''}
          </Text>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ searchQuery }: { searchQuery?: string }) {
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <Heading as="h3" className="text-xl font-semibold">
            {searchQuery ? 'No venues found' : 'No venues available'}
          </Heading>
          <Text className="text-muted-foreground">
            {searchQuery
              ? `No venues match your search for "${searchQuery}". Try a different search term.`
              : 'There are currently no venues with upcoming events available.'}
          </Text>
        </div>
        <div className="flex justify-center gap-4">
          {searchQuery && (
            <Link
              href="/venues"
              className="inline-flex rounded-lg border border-border bg-card px-6 py-2 text-sm font-medium text-foreground transition hover:border-primary/50"
            >
              Clear Search
            </Link>
          )}
          <Link
            href="/events"
            className="inline-flex rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Browse Events
          </Link>
        </div>
      </div>
    </section>
  );
}
