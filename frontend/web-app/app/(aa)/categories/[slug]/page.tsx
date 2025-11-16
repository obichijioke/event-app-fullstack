import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  fetchCategoryBySlug,
  fetchCategories,
  getSubcategories,
} from '@/lib/categories';
import { fetchEvents } from '@/lib/events';
import { EventCard } from '@/components/homepage';
import { Heading, Text, Badge } from '@/components/ui';

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    };
  }

  return {
    title: `${category.name} Events`,
    description: `Browse and book tickets for ${category.name} events`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const allCategories = await fetchCategories();
  const subcategories = getSubcategories(allCategories, category.id);
  const events = await fetchEvents({ category: category.id, upcoming: true });

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      <header className="mb-10 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/categories"
            className="text-sm text-muted-foreground hover:text-primary transition"
          >
            ← All Categories
          </Link>
        </div>
        <Heading as="h1" className="text-4xl font-bold lg:text-5xl">
          {category.name}
        </Heading>
        <Text className="max-w-2xl text-base text-muted-foreground lg:text-lg">
          Discover and book tickets for {category.name.toLowerCase()} events
        </Text>
      </header>

      <div className="mb-12 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          <StatCard label="Total Events" value={events.length.toString()} icon="🎉" />
          <StatCard label="Subcategories" value={subcategories.length.toString()} icon="📂" />
          <StatCard label="Live Events" value={events.length.toString()} icon="🔴" />
        </div>
      </div>

      {subcategories.length > 0 && (
        <section className="mb-12">
          <Heading as="h2" className="mb-6 text-2xl font-semibold">
            Subcategories
          </Heading>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {subcategories.map((subcat) => (
              <Link
                key={subcat.id}
                href={`/categories/${subcat.slug}`}
                className="group rounded-xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
              >
                <Text className="font-semibold text-foreground group-hover:text-primary transition">
                  {subcat.name}
                </Text>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-6 flex items-center justify-between">
          <Heading as="h2" className="text-2xl font-semibold">
            {events.length > 0 ? 'Upcoming Events' : 'Events'}
          </Heading>
          {events.length > 0 && (
            <Badge variant="outline" size="sm">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyState categoryName={category.name} />
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string; }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <div>
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
        <Text className="text-sm text-muted-foreground">{label}</Text>
      </div>
    </div>
  );
}

function EmptyState({ categoryName }: { categoryName: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="space-y-2">
          <Heading as="h3" className="text-xl font-semibold">No events in this category yet</Heading>
          <Text className="text-muted-foreground">
            There are currently no {categoryName.toLowerCase()} events available. Check back soon or explore other categories.
          </Text>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/categories" className="inline-flex rounded-lg border border-border bg-card px-6 py-2 text-sm font-medium text-foreground hover:border-primary/50 transition">
            Browse Categories
          </Link>
          <Link href="/events" className="inline-flex rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
            All Events
          </Link>
        </div>
      </div>
    </section>
  );
}
