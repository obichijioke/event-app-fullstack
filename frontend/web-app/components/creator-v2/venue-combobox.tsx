'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Plus, Building2 } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
  capacity?: number;
}

interface VenueComboBoxProps {
  venues: Venue[];
  selectedVenueId?: string;
  loading?: boolean;
  placeholder?: string;
  onSelect: (venueId: string) => void;
  onCreateNew?: () => void;
}

export function VenueComboBox({
  venues,
  selectedVenueId,
  loading = false,
  placeholder = 'Search venues...',
  onSelect,
  onCreateNew,
}: VenueComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  const filteredVenues = useMemo(() => {
    if (!searchQuery.trim()) return venues;

    const query = searchQuery.toLowerCase();
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.address?.city?.toLowerCase().includes(query) ||
        v.address?.state?.toLowerCase().includes(query) ||
        v.address?.country?.toLowerCase().includes(query)
    );
  }, [venues, searchQuery]);

  // Group venues by city
  const groupedVenues = useMemo(() => {
    const groups: Record<string, Venue[]> = {};

    filteredVenues.forEach((venue) => {
      const city = venue.address?.city || 'Other locations';
      if (!groups[city]) {
        groups[city] = [];
      }
      groups[city].push(venue);
    });

    return groups;
  }, [filteredVenues]);

  const handleSelect = (venueId: string) => {
    onSelect(venueId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 text-left">
          {selectedVenue ? (
            <>
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedVenue.name}</p>
                {selectedVenue.address?.city && (
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedVenue.address.city}
                    {selectedVenue.address.state && `, ${selectedVenue.address.state}`}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                {loading ? 'Loading venues...' : placeholder}
              </span>
            </>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div className="absolute z-50 mt-2 w-full rounded-lg border border-border bg-background shadow-lg">
            {/* Search Input */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Venue List */}
            <div className="max-h-[300px] overflow-y-auto p-1">
              {/* Clear Selection Option */}
              {selectedVenueId && (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">No venue selected</span>
                </button>
              )}

              {/* Grouped Venues */}
              {Object.keys(groupedVenues).length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No venues found</p>
                  {searchQuery && (
                    <p className="text-xs mt-1">Try a different search term</p>
                  )}
                </div>
              ) : (
                Object.entries(groupedVenues).map(([city, cityVenues]) => (
                  <div key={city} className="mb-1">
                    {/* City Header */}
                    {Object.keys(groupedVenues).length > 1 && (
                      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {city}
                      </div>
                    )}

                    {/* Venues in City */}
                    {cityVenues.map((venue) => (
                      <button
                        key={venue.id}
                        type="button"
                        onClick={() => handleSelect(venue.id)}
                        className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left ${
                          venue.id === selectedVenueId ? 'bg-muted' : ''
                        }`}
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{venue.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {venue.address && (
                              <p className="text-xs text-muted-foreground truncate">
                                {[
                                  venue.address.city,
                                  venue.address.state,
                                  venue.address.country,
                                ]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                            )}
                            {venue.capacity && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                • {venue.capacity.toLocaleString()} capacity
                              </span>
                            )}
                          </div>
                        </div>
                        {venue.id === selectedVenueId && (
                          <svg
                            className="h-4 w-4 text-primary shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Create New Venue */}
            {onCreateNew && (
              <div className="border-t border-border p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onCreateNew();
                    setIsOpen(false);
                  }}
                  className="w-full justify-start gap-2 text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" />
                  Create new venue
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
