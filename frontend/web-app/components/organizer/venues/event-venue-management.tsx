'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, Plus, Search, Check, ArrowUpRight, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { EmptyState } from '@/components/organizer/empty-state';
import { StatCard } from '@/components/organizer/stat-card';
import { Badge } from '@/components/ui/badge';
import type { DashboardEvent, Venue } from '@/lib/types/organizer';

interface EventVenueManagementProps {
  eventId: string;
}

export function EventVenueManagement({ eventId }: EventVenueManagementProps) {
  const { currentOrganization } = useOrganizerStore();
  const [event, setEvent] = useState<DashboardEvent & { venue?: Venue } | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);
      const [eventData, venuesData] = await Promise.all([
        organizerApi.events.get(eventId, currentOrganization.id),
        organizerApi.venues.list(currentOrganization.id),
      ]);
      setEvent(eventData as DashboardEvent & { venue?: Venue });
      setVenues(venuesData);
    } catch (err) {
      console.error('Failed to load venue management data:', err);
      setError('Failed to load event or venues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentOrganization, eventId]);

  const filteredVenues = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return venues;
    return venues.filter((venue) => {
      const city = venue.address?.city?.toLowerCase() || '';
      return (
        venue.name.toLowerCase().includes(term) ||
        city.includes(term)
      );
    });
  }, [search, venues]);

  const handleAssignVenue = async (venueId: string) => {
    if (!currentOrganization) return;
    try {
      setSaving(true);
      await organizerApi.events.update(
        eventId,
        { venueId },
        currentOrganization.id
      );
      toast.success('Venue updated for this event');
      const updatedVenue = venues.find((v) => v.id === venueId);
      setEvent((prev) => (prev ? { ...prev, venueId, venue: updatedVenue } : prev));
    } catch (err) {
      console.error('Failed to assign venue:', err);
      toast.error('Could not update venue. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearVenue = async () => {
    if (!currentOrganization) return;
    try {
      setSaving(true);
      await organizerApi.events.update(
        eventId,
        { venueId: null as unknown as string },
        currentOrganization.id
      );
      toast.success('Venue removed from this event');
      setEvent((prev) => (prev ? { ...prev, venueId: undefined, venue: undefined } : prev));
    } catch (err) {
      console.error('Failed to remove venue:', err);
      toast.error('Could not remove venue. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  if (!currentOrganization) {
    return (
      <EmptyState
        title="No organization selected"
        description="Pick an organization to manage venues for this event."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <EmptyState
        title="Unable to load venues"
        description={error || 'Event not found'}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard title="Current venue" className="lg:col-span-2">
          {event.venue ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">{event.venue.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.venue.address.line1}
                    {event.venue.address.city ? `, ${event.venue.address.city}` : ''}
                  </p>
                </div>
                {event.venue.visibility === 'shared_ref' && (
                  <Badge variant="outline" className="ml-auto">
                    Catalog
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/organizer/venues/${event.venue.id}/edit`}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted transition text-sm"
                >
                  Edit venue
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleClearVenue}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10 transition text-sm disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" />
                  Remove from event
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">No venue selected</p>
                <p className="text-sm text-muted-foreground">
                  Choose an existing venue or create a new one for this event.
                </p>
              </div>
              <Link
                href="/organizer/venues/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Create venue
              </Link>
            </div>
          )}
        </StatCard>

        <StatCard title="Quick actions">
          <div className="space-y-3 text-sm">
            <Link
              href="/organizer/venues"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ArrowUpRight className="w-4 h-4" />
              Go to Venues library
            </Link>
            <Link
              href="/organizer/venues/create"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Plus className="w-4 h-4" />
              Create new venue
            </Link>
            <Link
              href={`/organizer/seatmaps/create${event.venueId ? `?venueId=${event.venueId}` : ''}`}
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <MapPin className="w-4 h-4" />
              Add seatmap for this venue
            </Link>
          </div>
        </StatCard>
      </div>

      <StatCard title="Select an existing venue">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search by name or city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Link
              href="/organizer/venues/create"
              className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted transition text-sm"
            >
              <Plus className="w-4 h-4" />
              New venue
            </Link>
          </div>

          {filteredVenues.length === 0 ? (
            <EmptyState
              title="No venues found"
              description="Adjust your search or create a new venue."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredVenues.map((venue) => {
                const isSelected = event.venueId === venue.id;
                return (
                  <div
                    key={venue.id}
                    className="border border-border rounded-lg p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{venue.name}</p>
                          {isSelected && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <Check className="w-3 h-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {venue.address.line1}
                          {venue.address.city ? `, ${venue.address.city}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {venue.timezone} {venue.capacity ? `• Capacity ${venue.capacity}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleAssignVenue(venue.id)}
                        disabled={saving || isSelected}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-60 text-sm"
                      >
                        {isSelected ? 'Assigned' : 'Use this venue'}
                      </button>
                      <Link
                        href={`/organizer/venues/${venue.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </StatCard>
    </div>
  );
}
