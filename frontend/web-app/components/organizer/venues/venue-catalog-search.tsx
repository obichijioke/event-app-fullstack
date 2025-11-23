'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, Loader2, MapPin, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { organizerApi } from '@/lib/api/organizer-api';
import { useRequireOrganization } from '@/lib/hooks';
import { handleApiError } from '@/lib/utils';
import type { VenueCatalogEntry } from '@/lib/types/organizer';

interface VenueCatalogSearchProps {
  selectedVenue?: VenueCatalogEntry | null;
  onSelect: (venue: VenueCatalogEntry) => void;
  onClearSelection: () => void;
  onSkipToPrivate: () => void;
}

export function VenueCatalogSearch({
  selectedVenue,
  onSelect,
  onClearSelection,
  onSkipToPrivate,
}: VenueCatalogSearchProps) {
  const { currentOrganization } = useRequireOrganization();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<VenueCatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCatalog = useCallback(
    async (search: string) => {
      const orgId = currentOrganization?.id;
      if (!orgId) {
        return;
      }

      setLoading(true);
      try {
        const response = await organizerApi.venues.catalogSearch({
          search: search || undefined,
          limit: 6,
        });
        setResults(response.data);
      } catch (error) {
        const message = handleApiError(error, 'Failed to load shared venues');
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      void loadCatalog(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, loadCatalog]);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Search shared venues</h2>
          <p className="text-sm text-muted-foreground">
            Find professional venues that have been vetted by the platform. You can still create a
            private venue if nothing fits.
          </p>
        </div>
        <button
          type="button"
          onClick={onSkipToPrivate}
          className="text-sm font-medium text-primary hover:underline"
        >
          Can&apos;t find it? Create a private venue
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by venue name, city, or keyword"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="button"
          onClick={() => loadCatalog(searchQuery)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          Search
        </button>
      </div>

      {selectedVenue && (
        <div className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">
              Selected: {selectedVenue.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Address and timezone will be locked to the shared venue. You can still override the
              public display name or capacity.
            </p>
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs font-medium text-primary hover:underline"
          >
            Choose a different venue
          </button>
        </div>
      )}

      <div>
        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading venues...
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-10 text-center">
            <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No shared venues match your search</p>
            <p className="text-sm text-muted-foreground">
              Try a different search term or create a private venue instead.
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((venue) => {
              const location = formatLocation(venue);
              const capacity = formatCapacity(venue);
              const isSelected = selectedVenue?.id === venue.id;

              return (
                <div
                  key={venue.id}
                  className={`flex flex-col rounded-lg border p-4 transition hover:border-primary ${
                    isSelected ? 'border-primary shadow-sm' : 'border-border'
                  }`}
                >
                  {venue.imageUrl ? (
                    <div className="mb-4 h-32 overflow-hidden rounded-md border border-border/70">
                      <img
                        src={venue.imageUrl}
                        alt={venue.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                      No image available
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold">{venue.name}</h3>
                        {venue.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {venue.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{location}</span>
                        </div>
                      )}
                      {capacity && <p>Capacity: {capacity}</p>}
                      <p>Timezone: {venue.timezone}</p>
                      {venue.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {venue.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelect(venue)}
                    className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-primary"
                  >
                    {isSelected ? 'Selected' : 'Use this venue'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatLocation(venue: VenueCatalogEntry) {
  const parts: string[] = [];
  if (venue.address?.city) parts.push(venue.address.city);
  if (venue.address?.region) parts.push(venue.address.region);
  if (venue.address?.country) parts.push(venue.address.country);
  return parts.join(', ');
}

function formatCapacity(venue: VenueCatalogEntry) {
  if (venue.capacityMin && venue.capacityMax) {
    if (venue.capacityMin === venue.capacityMax) {
      return venue.capacityMin.toLocaleString();
    }
    return `${venue.capacityMin.toLocaleString()} - ${venue.capacityMax.toLocaleString()}`;
  }
  if (venue.capacityMax) {
    return `Up to ${venue.capacityMax.toLocaleString()}`;
  }
  if (venue.capacityMin) {
    return `${venue.capacityMin.toLocaleString()}+`;
  }
  return null;
}
