'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Search, MapPin } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { useAuth } from '@/components/auth';
import toast from 'react-hot-toast';
import type { Seatmap } from '@/lib/types/organizer';

export function SeatmapList() {
  const router = useRouter();
  const { currentOrganization } = useOrganizerStore();
  const { initialized: authInitialized, accessToken } = useAuth();
  const [seatmaps, setSeatmaps] = useState<Seatmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSeatmap, setEditingSeatmap] = useState<Seatmap | null>(null);

  useEffect(() => {
    if (authInitialized && accessToken && currentOrganization) {
      loadSeatmaps();
    }
  }, [authInitialized, accessToken, currentOrganization]);

  const loadSeatmaps = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const data = await organizerApi.seatmaps.list(currentOrganization.id);
      setSeatmaps(data);
    } catch (error: any) {
      console.error('Failed to load seatmaps:', error);
      toast.error(error?.message || 'Failed to load seatmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (seatmap: Seatmap) => {
    if (!confirm(`Are you sure you want to delete "${seatmap.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await organizerApi.seatmaps.delete(seatmap.id);
      toast.success('Seatmap deleted successfully');
      loadSeatmaps();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete seatmap');
    }
  };

  const handleEdit = (seatmap: Seatmap) => {
    router.push(`/organizer/seatmaps/${seatmap.id}/edit`);
  };

  const filteredSeatmaps = seatmaps.filter((seatmap) =>
    seatmap.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading seatmaps...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search seatmaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => router.push('/organizer/seatmaps/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Create Seatmap
        </button>
      </div>

      {/* Empty State */}
      {filteredSeatmaps.length === 0 && !searchQuery && (
        <div className="bg-card rounded-lg shadow-card p-12 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No seatmaps yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first seatmap to manage seating for your events
          </p>
          <button
            onClick={() => router.push('/organizer/seatmaps/create')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Create Your First Seatmap
          </button>
        </div>
      )}

      {/* No Search Results */}
      {filteredSeatmaps.length === 0 && searchQuery && (
        <div className="bg-card rounded-lg shadow-card p-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No seatmaps found</h3>
          <p className="text-muted-foreground">
            No seatmaps match your search query "{searchQuery}"
          </p>
        </div>
      )}

      {/* Seatmaps Grid */}
      {filteredSeatmaps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeatmaps.map((seatmap) => (
            <div
              key={seatmap.id}
              className="bg-card rounded-lg shadow-card border border-border overflow-hidden hover:shadow-lg transition"
            >
              {/* Seatmap Preview */}
              <div className="h-48 bg-secondary flex items-center justify-center">
                <MapPin className="w-16 h-16 text-muted-foreground" />
              </div>

              {/* Seatmap Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{seatmap.name}</h3>
                {seatmap.venue && (
                  <p className="text-sm text-muted-foreground mb-2">{seatmap.venue.name}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  {seatmap._count && (
                    <>
                      <span>{seatmap._count.seats} seats</span>
                      <span>•</span>
                      <span>{seatmap._count.events} events</span>
                    </>
                  )}
                  {seatmap._count && <span>•</span>}
                  <span>
                    {new Date(seatmap.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(seatmap)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-secondary transition text-sm"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(seatmap)}
                    className="px-3 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {filteredSeatmaps.length > 0 && (
        <div className="text-sm text-muted-foreground text-center pt-4 border-t border-border">
          Showing {filteredSeatmaps.length} of {seatmaps.length} seatmap{seatmaps.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
