'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { EmptyState } from '../empty-state';
import toast from 'react-hot-toast';
import type { UpdateEventDto } from '@/lib/types/organizer';

interface EventEditFormProps {
  eventId: string;
}

export function EventEditForm({ eventId }: EventEditFormProps) {
  const router = useRouter();
  const { currentOrganization } = useOrganizerStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: '',
    descriptionMd: '',
    visibility: 'public',
    startAt: '',
    endAt: '',
    doorTime: '',
    categoryId: '',
    venueId: '',
    seatmapId: '',
    coverImageUrl: '',
  });

  useEffect(() => {
    async function loadEvent() {
      if (!currentOrganization) return;

      try {
        setLoading(true);
        const data = await organizerApi.events.get(eventId, currentOrganization.id);
        setFormData({
          title: data.title || '',
          descriptionMd: data.descriptionMd || '',
          visibility: data.visibility || 'public',
          startAt: data.startAt ? new Date(data.startAt).toISOString().slice(0, 16) : '',
          endAt: data.endAt ? new Date(data.endAt).toISOString().slice(0, 16) : '',
          doorTime: data.doorTime ? new Date(data.doorTime).toISOString().slice(0, 16) : '',
          categoryId: data.categoryId || '',
          venueId: data.venueId || '',
          seatmapId: data.seatmapId || '',
          coverImageUrl: data.coverImageUrl || '',
        });
      } catch (error) {
        console.error('Failed to load event:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [currentOrganization, eventId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;

    try {
      setSaving(true);

      const updateData: UpdateEventDto = {
        title: formData.title,
        descriptionMd: formData.descriptionMd,
        visibility: formData.visibility,
        coverImageUrl: formData.coverImageUrl || undefined,
      };

      if (formData.startAt) {
        updateData.startAt = new Date(formData.startAt).toISOString();
      }
      if (formData.endAt) {
        updateData.endAt = new Date(formData.endAt).toISOString();
      }
      if (formData.doorTime) {
        updateData.doorTime = new Date(formData.doorTime).toISOString();
      }
      if (formData.categoryId) {
        updateData.categoryId = formData.categoryId;
      }
      if (formData.venueId) {
        updateData.venueId = formData.venueId;
      }
      if (formData.seatmapId) {
        updateData.seatmapId = formData.seatmapId;
      }

      await organizerApi.events.update(eventId, updateData, currentOrganization.id);
      toast.success('Event updated successfully');
      router.push(`/organizer/events/${eventId}`);
    } catch (error) {
      console.error('Failed to update event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="No Organization Selected"
          description="Please select an organization to edit events"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
        <p className="text-muted-foreground">Update your event details</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  name="descriptionMd"
                  value={formData.descriptionMd}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe your event (supports Markdown)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Visibility
                </label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  name="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-semibold mb-4">Date & Time</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Door Time
                </label>
                <input
                  type="datetime-local"
                  name="doorTime"
                  value={formData.doorTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-border pt-6 flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
