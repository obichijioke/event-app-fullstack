import Link from 'next/link';
import { Badge, Text, buttonVariants } from '@/components/ui';
import { HomepageFilters } from '@/lib/homepage';
import { cn } from '@/lib/utils';

interface HomepageFiltersProps {
  filters?: HomepageFilters;
}

export function HomepageFiltersBar({ filters }: HomepageFiltersProps) {
  if (!filters) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Text className="text-base text-muted-foreground">
            Tailor the feed by city, genre, or timeframe — everything updates in
            sync.
          </Text>
          <div className="mt-2 flex flex-wrap gap-3">
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
                    (item) => item.id === filters.selected.timeframe,
                  )?.label
                }
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Timeframes
            </Text>
            <div className="flex flex-wrap gap-2">
              {filters.timeframes.map((timeframe) => {
                const isActive = timeframe.id === filters.selected.timeframe;
                return (
                  <Link
                    key={timeframe.id}
                    href={buildFilterUrl(
                      { timeframe: timeframe.id },
                      filters.selected,
                    )}
                    className={cn(
                      buttonVariants({
                        variant: isActive ? 'primary' : 'outline',
                        size: 'sm',
                      }),
                      'px-4',
                    )}
                  >
                    {timeframe.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Categories
            </Text>
            <div className="flex flex-wrap gap-2">
              {filters.categories.slice(0, 6).map((category) => (
                <FilterPill
                  key={category.id}
                  label={category.name}
                  active={category.slug === filters.selected.category}
                  href={buildFilterUrl(
                    { category: category.slug },
                    filters.selected,
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterPill({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-full border px-4 py-1.5 text-sm font-medium transition hover:border-primary hover:text-primary',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-foreground',
      )}
    >
      {label}
    </Link>
  );
}

function buildFilterUrl(
  overrides: { timeframe?: string; category?: string },
  selected: HomepageFilters['selected'],
) {
  const url = new URL('/', 'http://localhost');
  const params = new URLSearchParams();

  if (selected.city) params.set('city', selected.city);
  if (selected.category) params.set('category', selected.category);
  if (selected.timeframe) params.set('timeframe', selected.timeframe);

  if (overrides.category !== undefined) {
    if (overrides.category) {
      params.set('category', overrides.category);
    } else {
      params.delete('category');
    }
  }

  if (overrides.timeframe !== undefined) {
    if (overrides.timeframe) {
      params.set('timeframe', overrides.timeframe);
    } else {
      params.delete('timeframe');
    }
  }

  url.search = params.toString();
  return params.size ? `${url.pathname}?${params.toString()}` : url.pathname;
}
