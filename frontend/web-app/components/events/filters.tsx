'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Select, Switch, Label, Text } from '@/components/ui';
import type { CategorySummary } from '@/lib/homepage';

interface EventsFiltersProps {
  categories: CategorySummary[];
  initialSearch?: string;
  selectedCategory?: string;
  upcoming?: boolean;
  resultCount: number;
}

export function EventsFilters({
  categories,
  initialSearch = '',
  selectedCategory,
  upcoming = false,
  resultCount,
}: EventsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'All categories' },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories],
  );

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams?.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value.length > 0) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const queryString = params.toString();
      startTransition(() => {
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateQuery({ search: searchTerm.trim() || null });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Text className="text-xs uppercase text-muted-foreground tracking-wide">
            Showing {resultCount} event{resultCount === 1 ? '' : 's'}
          </Text>
          <h2 className="text-2xl font-semibold text-foreground">Find experiences near you</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="search">Search events</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Search by artist, organizer, or city"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <Button type="submit" loading={isPending}>
                Search
              </Button>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={selectedCategory ?? ''}
              onChange={(event) =>
                updateQuery({
                  category: event.target.value || null,
                })
              }
              options={categoryOptions}
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            <div className="flex flex-col">
              <Label htmlFor="upcoming" className="text-sm font-medium">
                Upcoming only
              </Label>
              <Text className="text-xs text-muted-foreground">Hide past events</Text>
            </div>
            <Switch
              id="upcoming"
              checked={upcoming}
              onCheckedChange={(checked) =>
                updateQuery({
                  upcoming: checked ? 'true' : null,
                })
              }
            />
          </div>
        </form>
      </div>
    </div>
  );
}
