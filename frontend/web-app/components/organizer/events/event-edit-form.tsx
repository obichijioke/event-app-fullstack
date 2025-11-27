'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Upload, Image as ImageIcon, Link as LinkIcon, Sparkles, Shield } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { EmptyState } from '../empty-state';
import { categoriesApi } from '@/lib/api/categories-api';
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
  const [venues, setVenues] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<any>({
    title: '',
    shortDescription: '',
    descriptionMd: '',
    visibility: 'public',
    startAt: '',
    endAt: '',
    doorTime: '',
    categoryId: '',
    venueId: '',
    seatmapId: '',
    coverImageUrl: '',
    ageRestriction: '',
    refundPolicy: '',
    transferAllowed: true,
    transferCutoff: '',
  });

  useEffect(() => {
    async function loadEvent() {
      if (!currentOrganization) return;

      try {
        setLoading(true);
        const [eventData, venuesData, categoryData] = await Promise.all([
          organizerApi.events.get(eventId, currentOrganization.id),
          organizerApi.venues.list(currentOrganization.id).catch(() => []),
          categoriesApi.getCategories().catch(() => []),
        ]);
        
        setFormData({
          title: eventData.title || '',
          shortDescription: '', // Backend lacks explicit short field; keep local only
          descriptionMd: eventData.descriptionMd || '',
          visibility: eventData.visibility || 'public',
          startAt: eventData.startAt ? new Date(eventData.startAt).toISOString().slice(0, 16) : '',
          endAt: eventData.endAt ? new Date(eventData.endAt).toISOString().slice(0, 16) : '',
          doorTime: eventData.doorTime ? new Date(eventData.doorTime).toISOString().slice(0, 16) : '',
          categoryId: eventData.categoryId || '',
          venueId: eventData.venueId || '',
          seatmapId: eventData.seatmapId || '',
          coverImageUrl: eventData.coverImageUrl || '',
          ageRestriction: eventData.ageRestriction || '',
          refundPolicy: (eventData as any)?.policies?.refundPolicy || '',
          transferAllowed: (eventData as any)?.policies?.transferAllowed ?? true,
          transferCutoff: (eventData as any)?.policies?.transferCutoff
            ? new Date((eventData as any).policies.transferCutoff).toISOString().slice(0, 16)
            : '',
        });
        setVenues(venuesData);
        setCategories(categoryData || []);
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

      const trimmedCoverImage = formData.coverImageUrl?.trim();
      if (trimmedCoverImage) {
        try {
          // Validate absolute URL early to avoid API 400s
          const url = new URL(trimmedCoverImage);
          if (!url.protocol.startsWith('http')) {
            throw new Error('Cover image must use http/https');
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Cover image URL must be a valid link';
          toast.error(message);
          setSaving(false);
          return;
        }
      }

      const updateData: UpdateEventDto = {
        title: formData.title,
        descriptionMd: `${formData.shortDescription ? `${formData.shortDescription}\n\n` : ''}${formData.descriptionMd}`,
        visibility: formData.visibility,
        coverImageUrl: trimmedCoverImage || undefined,
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
      if (formData.ageRestriction) {
        (updateData as any).ageRestriction = formData.ageRestriction;
      }

      await organizerApi.events.update(eventId, updateData, currentOrganization.id);
      await organizerApi.events.policies.createOrUpdate(eventId, {
        refundPolicy: formData.refundPolicy || undefined,
        transferAllowed: formData.transferAllowed,
        transferCutoff: formData.transferCutoff
          ? new Date(formData.transferCutoff).toISOString()
          : undefined,
        resaleAllowed: false,
      }, currentOrganization.id);
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
          <p className="text-muted-foreground">Update your event details and policies</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/events/${eventId}`)}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition"
          >
            View Public Page
          </button>
          <button
            type="button"
            onClick={() => router.push(`/organizer/events/${eventId}/tickets`)}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition"
          >
            Manage Tickets
          </button>
          <button
            type="button"
            onClick={() => router.push(`/organizer/events/${eventId}/attendees`)}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition"
          >
            Attendees
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {/* Cover */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-semibold">Cover Image</h2>
                <p className="text-sm text-muted-foreground">Upload or replace your event cover</p>
              </div>
              <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg cursor-pointer hover:bg-muted transition">
                <Upload className="w-4 h-4" />
                Replace
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setFormData((prev: any) => ({ ...prev, coverImageUrl: url }));
                    toast('Preview generated. Upload integration needed to persist.', { icon: 'ℹ️' });
                  }}
                />
              </label>
            </div>
            <div className="relative aspect-[16/9] rounded-lg border border-border overflow-hidden bg-muted/50">
              {formData.coverImageUrl ? (
                <img
                  src={formData.coverImageUrl}
                  alt="Event cover"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <p className="text-sm">No cover image. Add one to make your event pop.</p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-center gap-2 text-white text-sm">
                <LinkIcon className="w-4 h-4" />
                <input
                  type="url"
                  name="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/cover.jpg"
                  className="flex-1 bg-black/30 border border-white/20 rounded px-2 py-1 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

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
                  Short Description
                </label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  rows={2}
                  maxLength={160}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="One-liner that appears on listings (max 160 chars)"
                />
                <p className="text-xs text-muted-foreground text-right">{(formData.shortDescription || '').length}/160</p>
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
                  Category
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Age Restriction (optional)
                </label>
                <input
                  type="text"
                  name="ageRestriction"
                  value={formData.ageRestriction || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 18+"
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

          {/* Venue */}
          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-semibold mb-4">Venue</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Venue
              </label>
              <select
                name="venueId"
                value={formData.venueId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No venue selected</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Select a venue for your event. You can manage venues in the Venues section.
              </p>
            </div>
          </div>

          {/* Policies */}
          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Event Policies
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Set refund and transfer rules for attendees.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Refund Policy
                </label>
                <textarea
                  name="refundPolicy"
                  value={formData.refundPolicy}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe when and how refunds are issued"
                />
              </div>
              <div className="flex items-center justify-between border border-border rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium">Allow Transfers</p>
                  <p className="text-xs text-muted-foreground">
                    Attendees can transfer tickets to someone else before the cutoff.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.transferAllowed}
                    onChange={(e) =>
                      setFormData((prev: any) => ({ ...prev, transferAllowed: e.target.checked }))
                    }
                  />
                  Enabled
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Transfer Cutoff
                </label>
                <input
                  type="datetime-local"
                  name="transferCutoff"
                  value={formData.transferCutoff}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Last date/time when transfers are allowed.
                </p>
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
