# Best Practices: Performance

## Caching with React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch events with caching
const useEvents = (filters?: EventFilters) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventService.listPublic(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation with cache invalidation
const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventRequest) => {
      const token = localStorage.getItem('accessToken')!;
      return eventService.create(orgId, data, token);
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

// Usage
const EventList: React.FC = () => {
  const { data: events, isLoading, error } = useEvents({ upcoming: true });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={handleApiError(error)} />;

  return (
    <div>
      {events?.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};
```

## Pagination and Infinite Scroll

```typescript
const useEventsPaginated = (page: number, limit: number) => {
  return useQuery({
    queryKey: ['events', page, limit],
    queryFn: async () => {
      const response = await fetch(
        `${BASE_URL}/events?page=${page}&limit=${limit}`,
      );
      return response.json() as Promise<PaginatedResponse<Event>>;
    },
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

// Infinite scroll
const useEventsInfinite = () => {
  return useInfiniteQuery({
    queryKey: ['events-infinite'],
    queryFn: ({ pageParam = 1 }) =>
      eventService.listPublic({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
  });
};
```

## Debouncing Search

```typescript
import { useMemo, useState } from 'react';
import { debounce } from 'lodash';

const EventSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Event[]>([]);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (term: string) => {
        if (term.length < 3) return;

        const events = await eventService.listPublic({ search: term });
        setResults(events);
      }, 500),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  return (
    <div>
      <input
        type="search"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search events..."
      />
      <EventList events={results} />
    </div>
  );
};
```

