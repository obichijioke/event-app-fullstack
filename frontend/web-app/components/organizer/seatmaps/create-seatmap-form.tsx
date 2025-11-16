'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SeatmapEditor, type SeatmapSpec } from './seatmap-editor';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { Venue } from '@/lib/types/organizer';
import toast from 'react-hot-toast';

export function CreateSeatmapForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const venueIdFromUrl = searchParams.get('venueId');
  const { currentOrganization } = useOrganizerStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState(venueIdFromUrl || '');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      loadVenues();
    }
  }, [currentOrganization]);

  const loadVenues = async () => {
    if (!currentOrganization) return;

    try {
      const data = await organizerApi.venues.list(currentOrganization.id);
      setVenues(data);
    } catch (error) {
      console.error('Failed to load venues:', error);
      toast.error('Failed to load venues');
    }
  };

  const handleNext = () => {
    if (!name.trim()) {
      toast.error('Please enter a seatmap name');
      return;
    }
    if (!selectedVenueId) {
      toast.error('Please select a venue');
      return;
    }
    setShowEditor(true);
  };

  const handleSave = async (spec: SeatmapSpec) => {
    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    setSaving(true);
    try {
      await organizerApi.seatmaps.create(selectedVenueId, {
        name: name.trim(),
        description: description.trim() || undefined,
        spec,
        isDefault,
      });
      toast.success('Seatmap created successfully');

      // Redirect to venue detail if we came from there, otherwise to seatmaps list
      if (venueIdFromUrl) {
        router.push(`/organizer/venues/${venueIdFromUrl}`);
      } else {
        router.push('/organizer/seatmaps');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create seatmap');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure? Any unsaved changes will be lost.')) {
      if (venueIdFromUrl) {
        router.push(`/organizer/venues/${venueIdFromUrl}`);
      } else {
        router.push('/organizer/seatmaps');
      }
    }
  };

  if (!showEditor) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg shadow-card border border-border p-8">
          <h2 className="text-2xl font-bold mb-6">Create New Seatmap</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Venue <span className="text-destructive">*</span>
              </label>
              <select
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                disabled={!!venueIdFromUrl}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                <option value="">Select a venue</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.address.city}
                  </option>
                ))}
              </select>
              {venues.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  No venues found. Please create a venue first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Seatmap Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Theater Layout, VIP Lounge A"
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus={!!venueIdFromUrl}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Give your seatmap a descriptive name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this seating configuration..."
                rows={3}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
              />
              <label htmlFor="isDefault" className="text-sm font-medium">
                Set as default seatmap for this venue
              </label>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">What's Next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Design your seating layout on a visual canvas</li>
                <li>• Add seats with drag-and-drop</li>
                <li>• Assign sections, rows, and seat numbers</li>
                <li>• Configure seat types (Standard, VIP, Accessible)</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border border-border rounded-md hover:bg-secondary transition"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                disabled={!name.trim() || !selectedVenueId || venues.length === 0}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50"
              >
                Continue to Editor
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SeatmapEditor
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
