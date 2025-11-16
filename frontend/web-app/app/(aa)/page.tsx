import type { Metadata } from 'next';
import {
  HomepageHero,
  HomepageFiltersBar,
  HomepageSectionBlock,
  OrganizersGrid,
} from '@/components/homepage';
import {
  fetchHomepageData,
  HomepageQueryParams,
  HomepageTimeframe,
  HomepageFilters,
} from '@/lib/homepage';
import { Text, Heading, Badge, Button } from '@/components/ui';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'EventFlow | Book the most trusted events across Africa',
  description:
    'Discover curated events, concerts, conferences, and nightlife experiences. Reserve seats, unlock presales, and follow your favourite organizers.',
};

export const revalidate = 60;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const normalizedParams = normalizeParams(resolvedSearchParams);
  const homepage = await fetchHomepageData(normalizedParams);

  const hasContent = homepage.sections.length > 0 || homepage.organizers.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <HomepageHero hero={homepage.hero} filters={homepage.filters} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 lg:py-16">
        <div className="space-y-12 lg:space-y-16">
          {/* Filters Bar */}
          <HomepageFiltersBar filters={homepage.filters} />

          {/* Event Sections */}
          {hasContent ? (
            <>
              {homepage.sections.map((section) => (
                <HomepageSectionBlock key={section.id} section={section} />
              ))}

              {/* Organizers Section */}
              {homepage.organizers.length > 0 && (
                <OrganizersGrid organizers={homepage.organizers} />
              )}

              {/* Trust Indicators */}
              <TrustSection />
            </>
          ) : (
            <EmptyState filters={homepage.filters} />
          )}

          {/* Cache Indicator (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <CacheIndicator
              timestamp={homepage.generatedAt}
              cacheKey={homepage.cache.key}
              hit={homepage.cache.hit}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function normalizeParams(
  searchParams?: Record<string, string | string[] | undefined>,
): HomepageQueryParams {
  if (!searchParams) return {};

  const getString = (value?: string | string[]) =>
    typeof value === 'string' ? value : undefined;

  const timeframe = getString(searchParams.timeframe);
  const allowedTimeframes: HomepageTimeframe[] = [
    'today',
    'weekend',
    'upcoming',
  ];

  return {
    city: getString(searchParams.city),
    category: getString(searchParams.category),
    timeframe: allowedTimeframes.includes(
      timeframe as HomepageTimeframe,
    )
      ? (timeframe as HomepageTimeframe)
      : undefined,
  };
}

function EmptyState({ filters }: { filters: HomepageFilters }) {
  const hasActiveFilters =
    filters.selected.category || filters.selected.timeframe || filters.selected.city;

  return (
    <section className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Icon */}
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

        {/* Heading */}
        <div className="space-y-2">
          <Heading as="h2" className="text-2xl font-semibold text-foreground">
            {hasActiveFilters
              ? "No events match your filters"
              : "We're lining up events for you"}
          </Heading>
          <Text className="text-base text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your filters or explore all available events"
              : "Organizers are publishing new events daily. Check back soon!"}
          </Text>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Text className="text-sm text-muted-foreground">Active filters:</Text>
            {filters.selected.city && (
              <Badge variant="outline" size="sm">
                City: {filters.selected.city}
              </Badge>
            )}
            {filters.selected.category && (
              <Badge variant="outline" size="sm">
                Category: {filters.selected.category}
              </Badge>
            )}
            {filters.selected.timeframe && (
              <Badge variant="outline" size="sm">
                Timeframe:{' '}
                {
                  filters.timeframes.find(
                    (t) => t.id === filters.selected.timeframe,
                  )?.label
                }
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="inline-flex">
            <Button variant="primary" size="lg">
              Clear all filters
            </Button>
          </Link>
          <Link href="/events" className="inline-flex">
            <Button variant="outline" size="lg">
              Browse all events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const stats = [
    { label: 'Events hosted', value: '10,000+', icon: '🎉' },
    { label: 'Happy attendees', value: '500K+', icon: '😊' },
    { label: 'Trusted organizers', value: '2,500+', icon: '⭐' },
    { label: 'Cities covered', value: '50+', icon: '🌍' },
  ];

  const features = [
    {
      title: 'Secure payments',
      description: 'Pay with confidence using Stripe or Paystack',
      icon: '🔒',
    },
    {
      title: 'Instant tickets',
      description: 'Get your tickets delivered instantly via email',
      icon: '⚡',
    },
    {
      title: 'Easy transfers',
      description: 'Transfer tickets to friends with a single click',
      icon: '🎫',
    },
    {
      title: '24/7 support',
      description: 'Our team is here to help whenever you need',
      icon: '💬',
    },
  ];

  return (
    <section className="space-y-12 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-8 lg:p-12">
      {/* Stats */}
      <div>
        <div className="mb-8 text-center">
          <Heading as="h2" className="text-3xl font-semibold text-foreground">
            Trusted by event-goers across Africa
          </Heading>
          <Text className="mt-2 text-muted-foreground">
            Join thousands of people discovering and attending amazing events
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-6 text-center"
            >
              <div className="mb-2 text-3xl" aria-hidden="true">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <Text className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <div className="mb-8 text-center">
          <Heading as="h3" className="text-2xl font-semibold text-foreground">
            Why choose EventFlow?
          </Heading>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-3 text-3xl" aria-hidden="true">
                {feature.icon}
              </div>
              <Heading as="h4" className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </Heading>
              <Text className="text-sm text-muted-foreground">
                {feature.description}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CacheIndicator({
  timestamp,
  cacheKey,
  hit,
}: {
  timestamp: string;
  cacheKey: string;
  hit: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
      <span>
        Generated at {new Date(timestamp).toLocaleTimeString('en-NG', { timeStyle: 'short' })}
      </span>
      <span aria-hidden="true">•</span>
      <span>Cache key: {cacheKey}</span>
      <span aria-hidden="true">•</span>
      <span>{hit ? 'Cache hit' : 'Fresh fetch'}</span>
    </div>
  );
}
