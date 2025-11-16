'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { Venue, Seatmap } from '@/lib/types/organizer';
import { MapPin, Edit, Trash2, Loader2, Plus, Map, Calendar, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';

interface VenueDetailProps {
  venueId: string;
}

export function VenueDetail({ venueId }: VenueDetailProps) {
  const router = useRouter();
  const { currentOrganization } = useOrganizerStore();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [seatmaps, setSeatmaps] = useState<Seatmap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization) {
      loadVenue();
      loadSeatmaps();
    }
  }, [currentOrganization, venueId]);

  const loadVenue = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const data = await organizerApi.venues.get(venueId, currentOrganization.id);
      setVenue(data);
    } catch (error) {
      console.error('Failed to load venue:', error);
      toast.error('Failed to load venue');
    } finally {
      setLoading(false);
    }
  };

  const loadSeatmaps = async () => {
    try {
      const data = await organizerApi.seatmaps.getByVenue(venueId);
      setSeatmaps(data);
    } catch (error) {
      console.error('Failed to load seatmaps:', error);
    }
  };

  const handleDelete = async () => {
    if (!currentOrganization || !venue) return;

    if (!confirm(`Are you sure you want to delete "${venue.name}"? This will also delete all associated seatmaps.`)) {
      return;
    }

    try {
      await organizerApi.venues.delete(venue.id, currentOrganization.id);
      toast.success('Venue deleted successfully');
      router.push('/organizer/venues');
    } catch (error: any) {
      console.error('Failed to delete venue:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete venue';
      toast.error(errorMessage);
    }
  };

  const handleDeleteSeatmap = async (seatmap: Seatmap) => {
    if (!confirm(`Are you sure you want to delete seatmap "${seatmap.name}"?`)) {
      return;
    }

    try {
      await organizerApi.seatmaps.delete(seatmap.id);
      toast.success('Seatmap deleted successfully');
      loadSeatmaps();
    } catch (error: any) {
      console.error('Failed to delete seatmap:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete seatmap';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading venue...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Venue not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MapPin className="w-8 h-8 text-primary" />
              {venue.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {venue.catalogVenueId && (
                <Badge variant="outline-primary" size="sm" className="inline-flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Shared Catalog
                </Badge>
              )}
              <Badge variant="outline" size="sm" className="text-xs capitalize">
                {venue.visibility === 'shared_ref' ? 'Shared reference' : 'Private venue'}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            {venue.address.line1}, {venue.address.city}, {venue.address.region} {venue.address.postal}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/organizer/venues/${venue.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Venue Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Capacity</p>
          <p className="text-2xl font-bold">
            {venue.capacity ? venue.capacity.toLocaleString() : 'N/A'}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Timezone</p>
          <p className="text-2xl font-bold">{venue.timezone.split('/')[1]}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Seatmaps</p>
          <p className="text-2xl font-bold">{venue._count?.seatmaps || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Events</p>
          <p className="text-2xl font-bold">{venue._count?.events || 0}</p>
        </div>
      </div>

      {/* Address Details */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Address</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Street Address</p>
              <p className="font-medium">{venue.address.line1}</p>
              {venue.address.line2 && <p className="font-medium">{venue.address.line2}</p>}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">City, State ZIP</p>
              <p className="font-medium">
                {venue.address.city}, {venue.address.region} {venue.address.postal}
              </p>
            </div>
          </div>
          {(venue.latitude || venue.longitude) && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Coordinates</p>
              <p className="font-medium">
                {venue.latitude}, {venue.longitude}
              </p>
            </div>
          )}
        </div>
      </div>

      {venue.catalogVenue?.imageUrl && (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <img
            src={venue.catalogVenue.imageUrl}
            alt={venue.catalogVenue.name}
            className="h-64 w-full object-cover"
          />
        </div>
      )}

      {venue.catalogVenue && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Catalog Details</h2>
          {venue.catalogVenue.imageUrl && (
            <div className="mb-4 h-48 overflow-hidden rounded-lg border border-border/70">
              <img
                src={venue.catalogVenue.imageUrl}
                alt={venue.catalogVenue.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Catalog Name</p>
              <p className="font-medium">{venue.catalogVenue.name}</p>
              {venue.catalogVenue.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {venue.catalogVenue.description}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tags</p>
              <div className="flex flex-wrap gap-2">
                {venue.catalogVenue.tags.length > 0 ? (
                  venue.catalogVenue.tags.map((tag) => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            This venue inherits address, timezone, and coordinates from the shared catalog entry.
            Updates to the catalog will apply to all linked organizer venues.
          </p>
        </div>
      )}

      {/* Seatmaps Section */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Map className="w-5 h-5" />
            Seatmaps
          </h2>
          <button
            onClick={() => router.push(`/organizer/seatmaps/create?venueId=${venue.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Create Seatmap
          </button>
        </div>

        {seatmaps.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg">
            <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No seatmaps configured for this venue</p>
            <button
              onClick={() => router.push(`/organizer/seatmaps/create?venueId=${venue.id}`)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
            >
              Create First Seatmap
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seatmaps.map((seatmap) => (
              <div
                key={seatmap.id}
                className="border rounded-lg p-4 hover:border-primary transition cursor-pointer"
                onClick={() => router.push(`/organizer/seatmaps/${seatmap.id}/edit`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{seatmap.name}</h3>
                    {seatmap.isDefault && (
                      <span className="inline-block mt-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                {seatmap.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {seatmap.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm pt-3 border-t">
                  <span className="text-muted-foreground">
                    {seatmap._count?.seats || 0} seats
                  </span>
                  <span className="text-muted-foreground">
                    {seatmap._count?.events || 0} events
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/organizer/seatmaps/${seatmap.id}/edit`);
                    }}
                    className="flex-1 px-3 py-2 border border-border rounded-md hover:bg-secondary transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSeatmap(seatmap);
                    }}
                    className="flex-1 px-3 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
