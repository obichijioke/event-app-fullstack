import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  fetchOrganizers,
  searchOrganizers,
  sortOrganizers,
} from '@/lib/organizers';
import { Heading, Text, Badge, Button, buttonVariants } from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Browse Event Organizers',
  description:
    'Discover trusted event organizers. Follow your favorites and stay updated on upcoming events.',
};

export const revalidate = 60;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrganizersPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const normalizedParams = normalizeParams(resolvedParams);

  let organizers = await fetchOrganizers();

  // Apply search filter
  if (normalizedParams.search) {
    organizers = searchOrganizers(organizers, normalizedParams.search);
  }

  // Apply sorting
  organizers = sortOrganizers(organizers, normalizedParams.sortBy);

  // Calculate stats
  const totalFollowers = organizers.reduce(
    (sum, org) => sum + org.followerCount,
    0,
  );
  const totalEvents = organizers.reduce((sum, org) => sum + org.eventCount, 0);

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-3">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          Event Organizers
        </p>
        <Heading as="h1" className="text-4xl font-bold lg:text-5xl">
          Trusted event organizers
        </Heading>
        <Text className="max-w-2xl text-base text-muted-foreground lg:text-lg">
          Discover and follow organizers creating amazing experiences. Get
          notified when they announce new events and enjoy exclusive presales.
        </Text>
      </header>

      {/* Stats */}
      <div className="mb-12 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatCard
            label="Active Organizers"
            value={organizers.length.toString()}
            icon="🏢"
          />
          <StatCard
            label="Total Followers"
            value={formatNumber(totalFollowers)}
            icon="⭐"
          />
          <StatCard
            label="Upcoming Events"
            value={formatNumber(totalEvents)}
            icon="🎉"
          />
          <StatCard label="Countries" value="—" icon="🌍" />
        </div>
      </div>

      {/* Filters */}
      <Suspense
        fallback={
          <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="h-12 animate-pulse rounded bg-muted"></div>
          </div>
        }
      >
        <OrganizersFilters
          initialSearch={normalizedParams.search}
          selectedSort={normalizedParams.sortBy}
          resultCount={organizers.length}
        />
      </Suspense>

      {/* Organizers Grid */}
      {organizers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {organizers.map((organizer) => (
            <OrganizerCard key={organizer.id} organizer={organizer} />
          ))}
        </div>
      ) : (
        <EmptyState hasSearch={!!normalizedParams.search} />
      )}
    </div>
  );
}

function normalizeParams(
  params?: Record<string, string | string[] | undefined>,
): {
  search?: string;
  sortBy: 'name' | 'followers' | 'events';
} {
  if (!params) {
    return { sortBy: 'followers' };
  }

  const getString = (value?: string | string[]) =>
    typeof value === 'string' ? value : undefined;

  const search = getString(params.search);
  const sortBy = getString(params.sort);

  const validSortOptions = ['name', 'followers', 'events'] as const;
  const selectedSort =
    sortBy && validSortOptions.includes(sortBy as any)
      ? (sortBy as 'name' | 'followers' | 'events')
      : 'followers';

  return {
    search: search ?? undefined,
    sortBy: selectedSort,
  };
}

interface OrganizerCardProps {
  organizer: {
    id: string;
    name: string;
    website?: string | null;
    country?: string | null;
    followerCount: number;
    eventCount: number;
    upcomingEvents: Array<{
      id: string;
      title: string;
      startAt: string;
    }>;
  };
}

function OrganizerCard({ organizer }: OrganizerCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Heading as="h3" className="text-xl font-semibold text-foreground">
            {organizer.name}
          </Heading>
          {organizer.country && (
            <Text className="mt-1 text-sm text-muted-foreground">
              {organizer.country}
            </Text>
          )}
        </div>
        <Badge variant="outline" size="sm">
          {formatNumber(organizer.followerCount)} followers
        </Badge>
      </div>

      {/* Stats */}
      <div className="mt-4 flex gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <div className="text-center">
          <Text className="text-lg font-bold text-foreground">
            {organizer.eventCount}
          </Text>
          <Text className="text-xs text-muted-foreground">Events</Text>
        </div>
        <div className="h-auto w-px bg-border"></div>
        <div className="text-center">
          <Text className="text-lg font-bold text-foreground">
            {formatNumber(organizer.followerCount)}
          </Text>
          <Text className="text-xs text-muted-foreground">Followers</Text>
        </div>
      </div>

      {/* Upcoming Events */}
      {organizer.upcomingEvents.length > 0 && (
        <div className="mt-4 space-y-2">
          <Text className="text-xs font-medium uppercase text-muted-foreground">
            Upcoming events
          </Text>
          {organizer.upcomingEvents.slice(0, 2).map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-dashed border-border p-3"
            >
              <Text className="text-xs uppercase text-primary">
                {formatDate(event.startAt, 'short')}
              </Text>
              <Text className="mt-1 font-medium">{event.title}</Text>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        {organizer.website ? (
          <a
            href={organizer.website}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Visit site
          </a>
        ) : (
          <div />
        )}
        <Link
          href={`/organizers/${organizer.id}`}
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
        >
          View profile
        </Link>
      </div>
    </article>
  );
}

interface OrganizersFiltersProps {
  initialSearch?: string;
  selectedSort: 'name' | 'followers' | 'events';
  resultCount: number;
}

function OrganizersFilters({
  initialSearch,
  selectedSort,
  resultCount,
}: OrganizersFiltersProps) {
  return (
    <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="flex-1">
          <form action="/organizers" method="get">
            <div className="relative">
              <input
                type="search"
                name="search"
                defaultValue={initialSearch}
                placeholder="Search organizers..."
                className="h-12 w-full rounded-lg border border-border bg-background px-4 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-3">
          <Text className="text-sm text-muted-foreground">Sort by:</Text>
          <div className="flex gap-2">
            <SortButton
              href="/organizers?sort=followers"
              active={selectedSort === 'followers'}
            >
              Followers
            </SortButton>
            <SortButton
              href="/organizers?sort=events"
              active={selectedSort === 'events'}
            >
              Events
            </SortButton>
            <SortButton
              href="/organizers?sort=name"
              active={selectedSort === 'name'}
            >
              Name
            </SortButton>
          </div>
        </div>
      </div>

      {/* Result count */}
      <div className="mt-4 pt-4 border-t border-border">
        <Text className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{resultCount}</span> organizer
          {resultCount !== 1 ? 's' : ''}
        </Text>
      </div>
    </div>
  );
}

function SortButton({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-lg border px-4 py-2 text-sm font-medium transition',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:border-primary/50',
      )}
    >
      {children}
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="text-2xl" aria-hidden="true">
        {icon}
      </span>
      <div>
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
        <Text className="text-sm text-muted-foreground">{label}</Text>
      </div>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
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
          <Heading as="h2" className="text-2xl font-semibold">
            {hasSearch
              ? 'No organizers found'
              : 'No organizers available yet'}
          </Heading>
          <Text className="text-muted-foreground">
            {hasSearch
              ? 'Try adjusting your search or browse all organizers'
              : 'Organizers will appear here once they start creating events'}
          </Text>
        </div>
        {hasSearch && (
          <Link href="/organizers" className="inline-flex">
            <Button variant="primary" size="lg">
              Clear search
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
