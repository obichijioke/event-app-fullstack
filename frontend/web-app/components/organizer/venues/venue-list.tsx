'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireOrganization } from '@/lib/hooks';
import { organizerApi } from '@/lib/api/organizer-api';
import { Venue } from '@/lib/types/organizer';
import { handleApiError } from '@/lib/utils';
import { MapPin, Plus, Edit, Trash2, Loader2, Building2, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';

export function VenueList() {
  const router = useRouter();
  const { currentOrganization, ensureOrganization } = useRequireOrganization();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentOrganization) {
      loadVenues();
    }
  }, [currentOrganization]);

  const loadVenues = async () => {
    const org = ensureOrganization();
    if (!org) return;

    try {
      setLoading(true);
      const data = await organizerApi.venues.list(org.id);
      setVenues(data);
    } catch (error) {
      const message = handleApiError(error, 'Failed to load venues');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (venue: Venue) => {
    const org = ensureOrganization();
    if (!org) return;

    if (!confirm(`Are you sure you want to delete "${venue.name}"? This will also delete all associated seatmaps.`)) {
      return;
    }

    try {
      await organizerApi.venues.delete(venue.id, org.id);
      toast.success('Venue deleted successfully');
      loadVenues();
    } catch (error) {
      const message = handleApiError(error, 'Failed to delete venue');
      toast.error(message);
    }
  };

  const filteredVenues = venues.filter((venue) =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.address.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Venues</h1>
          <p className="text-muted-foreground mt-1">
            Manage your event venues and seating arrangements
          </p>
        </div>
        <button
          onClick={() => router.push('/organizer/venues/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Add Venue
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search venues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Venues Grid */}
      {filteredVenues.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Venues</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'No venues match your search'
              : 'Create your first venue to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => router.push('/organizer/venues/create')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
            >
              Create Venue
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <div
              key={venue.id}
              className="border border-border rounded-lg p-6 bg-card hover:border-primary transition cursor-pointer"
              onClick={() => router.push(`/organizer/venues/${venue.id}`)}
            >
              {venue.catalogVenue?.imageUrl ? (
                <div className="mb-4 h-40 overflow-hidden rounded-md border border-border/70">
                  <img
                    src={venue.catalogVenue.imageUrl}
                    alt={venue.catalogVenue.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-4 flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                  No cover image
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{venue.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {venue.address.city}, {venue.address.region}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {venue.catalogVenueId && (
                      <Badge variant="outline-primary" size="sm" className="inline-flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        Shared Catalog
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      size="sm"
                      className="text-xs capitalize"
                    >
                      {venue.visibility === 'shared_ref' ? 'Shared reference' : 'Private'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium">
                    {venue.capacity ? venue.capacity.toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Seatmaps:</span>
                  <span className="font-medium">{venue._count?.seatmaps || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Events:</span>
                  <span className="font-medium">{venue._count?.events || 0}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/organizer/venues/${venue.id}/edit`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-secondary transition"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(venue);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
