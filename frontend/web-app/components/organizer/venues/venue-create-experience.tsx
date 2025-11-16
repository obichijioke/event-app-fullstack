'use client';

import { useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import type { VenueCatalogEntry } from '@/lib/types/organizer';
import { VenueCatalogSearch } from './venue-catalog-search';
import { VenueForm } from './venue-form';

export function VenueCreateExperience() {
  const [selectedCatalogVenue, setSelectedCatalogVenue] =
    useState<VenueCatalogEntry | null>(null);
  const [mode, setMode] = useState<'catalog' | 'private'>('catalog');

  const handleSelect = (venue: VenueCatalogEntry) => {
    setSelectedCatalogVenue(venue);
    setMode('catalog');
  };

  const handleClearSelection = () => {
    setSelectedCatalogVenue(null);
  };

  const handleSkipToPrivate = () => {
    setSelectedCatalogVenue(null);
    setMode('private');
  };

  return (
    <div className="space-y-8">
      {mode === 'catalog' && (
        <VenueCatalogSearch
          selectedVenue={selectedCatalogVenue}
          onSelect={handleSelect}
          onClearSelection={handleClearSelection}
          onSkipToPrivate={handleSkipToPrivate}
        />
      )}

      {mode === 'private' && (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Creating a private venue</p>
              <p>
                This venue will only be visible inside your organization, and you can edit every
                field manually.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMode('catalog')}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to shared catalog
          </button>
        </div>
      )}

      {selectedCatalogVenue && mode === 'catalog' && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary">
            Using {selectedCatalogVenue.name} from the shared catalog
          </p>
          <p className="text-sm text-muted-foreground">
            Address, timezone, and map coordinates are locked to the catalog entry. You can provide
            an internal nickname or capacity override below.
          </p>
        </div>
      )}

      <VenueForm catalogVenue={mode === 'catalog' ? selectedCatalogVenue ?? undefined : undefined} />
    </div>
  );
}
