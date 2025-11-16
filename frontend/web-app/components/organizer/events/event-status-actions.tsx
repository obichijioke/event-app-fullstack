'use client';

import { useState } from 'react';
import { Play, Pause, Ban, Trash2, Eye } from 'lucide-react';
import { EventStatus } from '@/lib/types/organizer';
import { organizerApi } from '@/lib/api/organizer-api';
import toast from 'react-hot-toast';

interface EventStatusActionsProps {
  eventId: string;
  orgId: string;
  currentStatus: EventStatus;
  onStatusChange?: () => void;
}

export function EventStatusActions({
  eventId,
  orgId,
  currentStatus,
  onStatusChange,
}: EventStatusActionsProps) {
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this event? It will become visible to the public.')) {
      return;
    }

    try {
      setLoading(true);
      await organizerApi.events.publish(eventId, orgId);
      toast.success('Event published successfully');
      onStatusChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish event');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!confirm('Are you sure you want to pause this event? Ticket sales will be stopped.')) {
      return;
    }

    try {
      setLoading(true);
      await organizerApi.events.pause(eventId, orgId);
      toast.success('Event paused successfully');
      onStatusChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to pause event');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (
      !confirm(
        'Are you sure you want to cancel this event? This action may trigger refunds for purchased tickets.'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await organizerApi.events.cancel(eventId, orgId);
      toast.success('Event canceled successfully');
      onStatusChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this event? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await organizerApi.events.delete(eventId, orgId);
      toast.success('Event deleted successfully');
      window.location.href = '/organizer/events';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const canPublish = ['draft', 'pending', 'approved', 'paused'].includes(currentStatus);
  const canPause = currentStatus === 'live';
  const canCancel = ['live', 'pending', 'approved'].includes(currentStatus);
  const canDelete = currentStatus === 'draft';

  return (
    <div className="flex flex-wrap gap-2">
      {canPublish && (
        <button
          onClick={handlePublish}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          Publish Event
        </button>
      )}

      {canPause && (
        <button
          onClick={handlePause}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
        >
          <Pause className="w-4 h-4" />
          Pause Event
        </button>
      )}

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
        >
          <Ban className="w-4 h-4" />
          Cancel Event
        </button>
      )}

      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Delete Event
        </button>
      )}

      <a
        href={`/events/${eventId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
      >
        <Eye className="w-4 h-4" />
        Preview
      </a>
    </div>
  );
}
