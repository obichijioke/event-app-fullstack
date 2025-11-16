'use client';

import { useEffect, useState } from 'react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { EventOccurrence, CreateOccurrenceDto } from '@/lib/types/organizer';
import { OccurrenceCard } from './occurrence-card';
import { OccurrenceForm } from './occurrence-form';
import { Loader2, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface OccurrenceManagementContentProps {
  eventId: string;
}

export function OccurrenceManagementContent({ eventId }: OccurrenceManagementContentProps) {
  const { currentOrganization } = useOrganizerStore();
  const [occurrences, setOccurrences] = useState<EventOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      loadOccurrences();
    }
  }, [eventId, currentOrganization]);

  const loadOccurrences = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const data = await organizerApi.events.occurrences.list(eventId, currentOrganization.id);
      setOccurrences(data);
    } catch (error) {
      console.error('Failed to load occurrences:', error);
      toast.error('Failed to load occurrences');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateOccurrenceDto) => {
    if (!currentOrganization) return;

    try {
      // Convert datetime-local values to ISO strings
      const occurrenceData: CreateOccurrenceDto = {
        startsAt: new Date(data.startsAt).toISOString(),
        endsAt: new Date(data.endsAt).toISOString(),
        gateOpenAt: data.gateOpenAt ? new Date(data.gateOpenAt).toISOString() : undefined,
      };

      await organizerApi.events.occurrences.create(eventId, occurrenceData, currentOrganization.id);
      toast.success('Occurrence added successfully');
      setShowForm(false);
      loadOccurrences();
    } catch (error) {
      console.error('Failed to create occurrence:', error);
      toast.error('Failed to create occurrence');
      throw error;
    }
  };

  const handleDelete = async (occurrence: EventOccurrence) => {
    if (!confirm(`Are you sure you want to delete this occurrence?`)) {
      return;
    }

    // Note: The API doesn't have a delete endpoint for occurrences in the spec
    // This would need to be implemented on the backend
    toast.error('Delete functionality not yet available');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading occurrences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Occurrences</h2>
          <p className="text-muted-foreground mt-1">
            Schedule multiple dates for your event
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Add Occurrence
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Use occurrences to schedule your event across multiple dates and times.
          Perfect for recurring events, multi-day conferences, or events with multiple showtimes.
        </p>
      </div>

      {/* Occurrences List */}
      {occurrences.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Occurrences</h3>
          <p className="text-muted-foreground mb-4">
            Add your first occurrence to schedule this event
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            Add First Occurrence
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {occurrences.map((occurrence) => (
            <OccurrenceCard
              key={occurrence.id}
              occurrence={occurrence}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <OccurrenceForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
