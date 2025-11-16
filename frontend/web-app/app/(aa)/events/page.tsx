import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EventsFilters, EventsGrid } from '@/components/events';
import { fetchEvents } from '@/lib/events';
import { fetchHomepageData } from '@/lib/homepage';

export const metadata: Metadata = {
  title: 'Browse Events',
  description: 'Discover and browse upcoming events across Africa.',
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventsPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const normalizedParams = normalizeParams(resolvedParams);

  const [events, homepage] = await Promise.all([
    fetchEvents({
      search: normalizedParams.search,
      category: normalizedParams.category,
      upcoming: normalizedParams.upcoming,
    }),
    fetchHomepageData(),
  ]);

  return (
    
    <div className="container mx-auto px-4 py-12 lg:py-16">
      <header className="mb-10 flex flex-col gap-3">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Discover events</p>
        <h1 className="text-4xl font-bold text-foreground lg:text-5xl">Find something unforgettable</h1>
        <p className="max-w-2xl text-base text-muted-foreground lg:text-lg">
          Browse curated experiences from trusted organizers. Filter by category or search to uncover concerts,
          conferences, markets, and everything in between.
        </p>
      </header>

      <div className="space-y-8">
        <Suspense fallback={
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </div>
        }>
          <EventsFilters
            categories={homepage.filters.categories}
            initialSearch={normalizedParams.search}
            selectedCategory={normalizedParams.category}
            upcoming={normalizedParams.upcoming}
            resultCount={events.length}
          />
        </Suspense>

        <EventsGrid events={events} />
      </div>
    </div>
  );
}

function normalizeParams(
  params?: Record<string, string | string[] | undefined>,
): {
  search?: string;
  category?: string;
  upcoming?: boolean;
} {
  if (!params) {
    return {};
  }

  const getString = (value?: string | string[]) =>
    typeof value === 'string' ? value : undefined;

  const search = getString(params.search);
  const category = getString(params.category);
  const upcomingParam = getString(params.upcoming);

  return {
    search: search ?? undefined,
    category: category ?? undefined,
    upcoming: upcomingParam === 'true',
  };
}
