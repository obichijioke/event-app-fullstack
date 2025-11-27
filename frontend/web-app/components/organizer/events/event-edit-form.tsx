'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Shield, Calendar, MapPin, Info } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { EmptyState } from '../empty-state';
import { categoriesApi } from '@/lib/api/categories-api';
import toast from 'react-hot-toast';
import type { UpdateEventDto } from '@/lib/types/organizer';
import { ImageUpload } from '@/components/ui/image-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface EventEditFormProps {
  eventId: string;
}

export function EventEditForm({ eventId }: EventEditFormProps) {
  const router = useRouter();
  const { currentOrganization } = useOrganizerStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [originalData, setOriginalData] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    title: '',
    shortDescription: '',
    descriptionMd: '',
    status: 'draft',
    visibility: 'public',
    startAt: '',
    endAt: '',
    doorTime: '',
    publishAt: '',
    categoryId: '',
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
        const [eventData, categoryData] = await Promise.all([
          organizerApi.events.get(eventId, currentOrganization.id),
          categoriesApi.getCategories().catch(() => []),
        ]);
        
        setFormData({
          title: eventData.title || '',
          shortDescription: (eventData as any).shortDescription || '',
          descriptionMd: eventData.descriptionMd || '',
          status: (eventData as any).status || 'draft',
          visibility: eventData.visibility || 'public',
          startAt: eventData.startAt ? new Date(eventData.startAt).toISOString().slice(0, 16) : '',
          endAt: eventData.endAt ? new Date(eventData.endAt).toISOString().slice(0, 16) : '',
          doorTime: eventData.doorTime ? new Date(eventData.doorTime).toISOString().slice(0, 16) : '',
          publishAt: (eventData as any).publishAt
            ? new Date((eventData as any).publishAt).toISOString().slice(0, 16)
            : '',
          categoryId: eventData.categoryId || '',
          coverImageUrl: eventData.coverImageUrl || '',
          ageRestriction: (eventData as any).ageRestriction || '',
          refundPolicy: (eventData as any)?.policies?.refundPolicy || '',
          transferAllowed: (eventData as any)?.policies?.transferAllowed ?? true,
          transferCutoff: (eventData as any)?.policies?.transferCutoff
            ? new Date((eventData as any).policies.transferCutoff).toISOString().slice(0, 16)
            : '',
        });
        setOriginalData({
          ...eventData,
          policies: (eventData as any)?.policies || {},
        });
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

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev: any) => ({ ...prev, [name]: checked }));
  };

  const buildPatch = (): { eventPatch: UpdateEventDto; policyPatch: any } => {
    const patch: any = {};
    const policyPatch: any = {};

    const setIfChanged = (field: string, value: any, originalValue: any) => {
      if (value !== undefined && value !== originalValue) {
        patch[field] = value === '' ? null : value;
      }
    };

    if (formData.startAt) patch.startAt = new Date(formData.startAt).toISOString();
    if (formData.endAt) patch.endAt = new Date(formData.endAt).toISOString();
    if (formData.doorTime) patch.doorTime = new Date(formData.doorTime).toISOString();
    if (formData.publishAt) patch.publishAt = new Date(formData.publishAt).toISOString();

    setIfChanged('title', formData.title, originalData?.title);
    setIfChanged('shortDescription', formData.shortDescription, (originalData as any)?.shortDescription);
    setIfChanged('descriptionMd', formData.descriptionMd, originalData?.descriptionMd);
    setIfChanged('visibility', formData.visibility, originalData?.visibility);
    setIfChanged('status', formData.status, originalData?.status);
    setIfChanged('categoryId', formData.categoryId, originalData?.categoryId);
    setIfChanged('ageRestriction', formData.ageRestriction, (originalData as any)?.ageRestriction);

    // Cover image
    const trimmedCoverImage = formData.coverImageUrl?.trim();
    if (trimmedCoverImage !== undefined && trimmedCoverImage !== originalData?.coverImageUrl) {
      patch.coverImageUrl = trimmedCoverImage || null;
    }

    const origPolicies = originalData?.policies || {};
    if (formData.refundPolicy !== origPolicies.refundPolicy) {
      policyPatch.refundPolicy = formData.refundPolicy || null;
    }
    if (formData.transferAllowed !== origPolicies.transferAllowed) {
      policyPatch.transferAllowed = formData.transferAllowed;
    }
    const cutoffIso = formData.transferCutoff ? new Date(formData.transferCutoff).toISOString() : null;
    if (cutoffIso !== (origPolicies.transferCutoff || null)) {
      policyPatch.transferCutoff = cutoffIso;
    }

    return { eventPatch: patch, policyPatch };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;

    try {
      setSaving(true);

      const trimmedCoverImage = formData.coverImageUrl?.trim();
      if (trimmedCoverImage) {
        try {
          // Validate absolute URL early to avoid API 400s if it's a URL
          // If it's a data URL (upload), we assume it's valid for now (in real app, upload first)
          if (!trimmedCoverImage.startsWith('data:')) {
             const url = new URL(trimmedCoverImage);
             if (!url.protocol.startsWith('http')) {
               throw new Error('Cover image must use http/https');
             }
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Cover image URL must be a valid link';
          toast.error(message);
          setSaving(false);
          return;
        }
      }

      const { eventPatch, policyPatch } = buildPatch();

      if (Object.keys(eventPatch).length === 0 && Object.keys(policyPatch).length === 0) {
        toast('No changes to save', { icon: 'ℹ️' });
        setSaving(false);
        return;
      }

      await organizerApi.events.update(eventId, eventPatch, currentOrganization.id);
      if (Object.keys(policyPatch).length > 0) {
        await organizerApi.events.policies.createOrUpdate(eventId, {
          ...policyPatch,
          resaleAllowed: policyPatch.resaleAllowed ?? false,
        });
      }
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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
          <p className="text-muted-foreground">Update your event details and policies</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/events/${eventId}`)}
          >
            View Public Page
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/organizer/events/${eventId}/tickets`)}
          >
            Manage Tickets
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          {/* Cover Image */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Event Cover</h2>
             </div>
             <p className="text-sm text-muted-foreground mb-4">
               Upload a high-quality image to grab attention. Recommended size: 1920x1080.
             </p>
             <ImageUpload
               value={formData.coverImageUrl}
               onChange={(url) => setFormData((prev: any) => ({ ...prev, coverImageUrl: url }))}
               maxSize={5}
               placeholder="https://example.com/cover.jpg"
               onUpload={async (file) => {
                 const res = await organizerApi.events.uploadImage(file);
                 return res.url;
               }}
             />
          </div>

          {/* Basic Info */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Basic Information</h2>
             </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  rows={2}
                  maxLength={160}
                  placeholder="One-liner that appears on listings (max 160 chars)"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {(formData.shortDescription || '').length}/160
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionMd">Full Description</Label>
                <Textarea
                  id="descriptionMd"
                  name="descriptionMd"
                  value={formData.descriptionMd}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Describe your event in detail (supports Markdown)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="categoryId">Category</Label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="ageRestriction">Age Restriction</Label>
                    <Input
                      id="ageRestriction"
                      name="ageRestriction"
                      value={formData.ageRestriction}
                      onChange={handleChange}
                      placeholder="e.g. 18+, 21+, All Ages"
                    />
                 </div>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
             <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Date & Time</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startAt">Start Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    id="startAt"
                    name="startAt"
                    value={formData.startAt}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endAt">End Date & Time</Label>
                  <Input
                    type="datetime-local"
                    id="endAt"
                    name="endAt"
                    value={formData.endAt}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doorTime">Door Time</Label>
                  <Input
                    type="datetime-local"
                    id="doorTime"
                    name="doorTime"
                    value={formData.doorTime}
                    onChange={handleChange}
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-8">
           {/* Publishing Status */}
           <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Publishing</h3>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="draft">Draft</option>
                  <option value="live">Live</option>
                  <option value="paused">Paused</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <select
                  id="visibility"
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="publishAt">Scheduled Publish</Label>
                  <Input
                    type="datetime-local"
                    id="publishAt"
                    name="publishAt"
                    value={formData.publishAt}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatically publish at this time.
                  </p>
              </div>
           </div>

           {/* Policies */}
           <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-lg">Policies</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundPolicy">Refund Policy</Label>
                <Textarea
                  id="refundPolicy"
                  name="refundPolicy"
                  value={formData.refundPolicy}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g. No refunds within 24h of event."
                />
              </div>

              <div className="flex items-center justify-between py-2">
                 <div className="space-y-0.5">
                    <Label className="text-base">Allow Transfers</Label>
                    <p className="text-xs text-muted-foreground">Can tickets be transferred?</p>
                 </div>
                 <Switch
                    checked={formData.transferAllowed}
                    onCheckedChange={(checked) => handleSwitchChange('transferAllowed', checked)}
                 />
              </div>

              {formData.transferAllowed && (
                <div className="space-y-2">
                  <Label htmlFor="transferCutoff">Transfer Cutoff</Label>
                  <Input
                    type="datetime-local"
                    id="transferCutoff"
                    name="transferCutoff"
                    value={formData.transferCutoff}
                    onChange={handleChange}
                  />
                </div>
              )}
           </div>

           <div className="sticky top-4 space-y-4">
              <Button
                type="submit"
                disabled={saving}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
                className="w-full"
              >
                Cancel
              </Button>
           </div>
        </div>
      </form>
    </div>
  );
}
