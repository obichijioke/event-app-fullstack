'use client';

import { useState, useEffect } from 'react';
import { MapPin, Check, Trash2, AlertCircle } from 'lucide-react';
import { seatmapsApi, type Seatmap } from '@/lib/api/seatmaps-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import toast from 'react-hot-toast';

interface EventSeatmapAssignmentProps {
  eventId: string;
}

export function EventSeatmapAssignment({ eventId }: EventSeatmapAssignmentProps) {
  const { currentOrganization } = useOrganizerStore();
  const [seatmaps, setSeatmaps] = useState<Seatmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedSeatmapId, setAssignedSeatmapId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadSeatmaps();
  }, [currentOrganization, eventId]);

  const loadSeatmaps = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const [seatmapData, eventData] = await Promise.all([
        seatmapsApi.getSeatmaps(),
        organizerApi.events.get(eventId, currentOrganization.id),
      ]);

      setSeatmaps(seatmapData);
      setAssignedSeatmapId(eventData.seatmapId ?? null);
    } catch (error: any) {
      console.error('Failed to load seatmaps:', error);
      toast.error(error.response?.data?.message || 'Failed to load seatmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (seatmapId: string) => {
    if (!currentOrganization) return;

    setAssigning(true);
    try {
      await organizerApi.events.assignSeatmap(eventId, seatmapId);
      toast.success('Seatmap assigned successfully');
      setAssignedSeatmapId(seatmapId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign seatmap');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!currentOrganization || !assignedSeatmapId) return;

    if (
      !confirm(
        'Remove seatmap assignment from this event? Existing ticket assignments will be preserved.',
      )
    ) {
      return;
    }

    setAssigning(true);
    try {
      await organizerApi.events.clearSeatmap(eventId);
      toast.success('Seatmap unassigned successfully');
      setAssignedSeatmapId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unassign seatmap');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading seatmaps...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Assignment */}
      {assignedSeatmapId && (
        <div className="bg-primary/10 border border-primary rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Currently Assigned Seatmap</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {seatmaps.find((s) => s.id === assignedSeatmapId)?.name || 'Unknown seatmap'}
              </p>
              <button
                onClick={handleUnassign}
                disabled={assigning}
                className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition text-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Remove Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-secondary/50 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium mb-1">About Seatmap Assignment</p>
          <ul className="text-muted-foreground space-y-1">
            <li>- Assign a seatmap layout to enable seat selection for ticket buyers</li>
            <li>- A snapshot of the seatmap is created to preserve the layout even if the original is modified</li>
            <li>- You can assign specific seats to ticket types after assignment</li>
          </ul>
        </div>
      </div>

      {/* Available Seatmaps */}
      <div>
        <h3 className="font-semibold mb-4">Available Seatmaps</h3>

        {seatmaps.length === 0 && (
          <div className="bg-card rounded-lg shadow-card border border-border p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No seatmaps available</h3>
            <p className="text-muted-foreground mb-4">
              Create a seatmap first to assign it to this event
            </p>
            <a
              href="/organizer/seatmaps/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
            >
              Create Seatmap
            </a>
          </div>
        )}

        {seatmaps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seatmaps.map((seatmap) => {
              const isAssigned = assignedSeatmapId === seatmap.id;

              return (
                <div
                  key={seatmap.id}
                  className={`bg-card rounded-lg shadow-card border overflow-hidden transition ${
                    isAssigned
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:shadow-lg'
                  }`}
                >
                  {/* Preview */}
                  <div className="h-32 bg-secondary flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-muted-foreground" />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h4 className="font-semibold mb-1">{seatmap.name}</h4>
                    <div className="text-sm text-muted-foreground mb-4">
                      {seatmap.totalSeats !== undefined && <span>{seatmap.totalSeats} seats</span>}
                    </div>

                    {/* Actions */}
                    {isAssigned ? (
                      <div className="flex items-center gap-2 text-primary text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Currently Assigned
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAssign(seatmap.id)}
                        disabled={assigning || !!assignedSeatmapId}
                        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm disabled:opacity-50"
                      >
                        Assign to Event
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Steps */}
      {assignedSeatmapId && (
        <div className="bg-secondary/50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Next Steps</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>1. Go to Ticket Types to assign specific seats to each ticket type</li>
            <li>2. Buyers will be able to select seats when purchasing tickets</li>
            <li>3. View seat assignments in the Tickets section</li>
          </ul>
        </div>
      )}
    </div>
  );
}
