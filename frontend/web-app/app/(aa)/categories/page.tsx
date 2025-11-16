import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCategories, buildCategoryTree } from '@/lib/categories';
import { Heading, Text, Badge } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Browse Event Categories',
  description: 'Explore events by category. Find concerts, sports, conferences, and more.',
};

export const revalidate = 300; // Revalidate every 5 minutes

export default async function CategoriesPage() {
  const categories = await fetchCategories();
  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-3">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">
          Event Categories
        </p>
        <Heading as="h1" className="text-4xl font-bold lg:text-5xl">
          Discover by category
        </Heading>
        <Text className="max-w-2xl text-base text-muted-foreground lg:text-lg">
          Browse events organized by category. From music and sports to business
          and arts, find exactly what you're looking for.
        </Text>
      </header>

      {/* Stats */}
      <div className="mb-12 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <StatCard
            label="Total Categories"
            value={categories.length.toString()}
            icon="📂"
          />
          <StatCard
            label="Top-Level"
            value={categoryTree.length.toString()}
            icon="🏷️"
          />
          <StatCard
            label="Subcategories"
            value={(categories.length - categoryTree.length).toString()}
            icon="📋"
          />
          <StatCard label="Active Events" value="—" icon="🎉" />
        </div>
      </div>

      {/* Categories Grid */}
      {categoryTree.length > 0 ? (
        <div className="space-y-12">
          {categoryTree.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

interface CategorySectionProps {
  category: {
    id: string;
    slug: string;
    name: string;
    children?: Array<{
      id: string;
      slug: string;
      name: string;
      _count?: { events?: number };
    }>;
    _count?: { events?: number };
  };
}

function CategorySection({ category }: CategorySectionProps) {
  const hasSubcategories = category.children && category.children.length > 0;

  return (
    <section className="space-y-6">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heading as="h2" className="text-2xl font-semibold">
            {category.name}
          </Heading>
          {category._count?.events !== undefined && (
            <Badge variant="outline" size="sm">
              {category._count.events} events
            </Badge>
          )}
        </div>
        <Link
          href={`/categories/${category.slug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      {/* Subcategories or Main Category Card */}
      {hasSubcategories ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {category.children!.map((subcategory) => (
            <CategoryCard key={subcategory.id} category={subcategory} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <CategoryCard category={category} />
        </div>
      )}
    </section>
  );
}

interface CategoryCardProps {
  category: {
    id: string;
    slug: string;
    name: string;
    _count?: { events?: number };
  };
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.slug}`}>
      <article className="group h-full rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
        <div className="flex h-full flex-col justify-between">
          <div>
            <Heading as="h3" className="text-lg font-semibold text-foreground group-hover:text-primary transition">
              {category.name}
            </Heading>
            {category._count?.events !== undefined && (
              <Text className="mt-2 text-sm text-muted-foreground">
                {category._count.events} event{category._count.events !== 1 ? 's' : ''}
              </Text>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
            <span>Explore</span>
            <span className="transition group-hover:translate-x-1">→</span>
          </div>
        </div>
      </article>
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

function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
      <div className="mx-auto max-w-md space-y-4">
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
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        </div>
        <Heading as="h2" className="text-xl font-semibold">
          No categories available
        </Heading>
        <Text className="text-muted-foreground">
          Categories will appear here once they're added to the system.
        </Text>
      </div>
    </section>
  );
}
