'use client';

import { useState, useEffect } from 'react';
import { CreatePromotionDto } from '@/lib/types/organizer';
import { useRequireOrganization } from '@/lib/hooks';
import { useFormState } from '@/lib/hooks';
import { organizerApi } from '@/lib/api/organizer-api';
import { toDollarString } from '@/lib/utils';
import { Modal } from '@/components/ui';
import { Loader2 } from 'lucide-react';

interface PromotionFormProps {
  eventId: string;
  onSubmit: (data: CreatePromotionDto) => Promise<void>;
  onCancel: () => void;
}

type PromotionFormData = CreatePromotionDto & Record<string, unknown>;

export function PromotionForm({ eventId, onSubmit, onCancel }: PromotionFormProps) {
  const { currentOrganization } = useRequireOrganization();
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);

  const { formData, setFormData, loading, handleChange, handleSubmit } = useFormState<PromotionFormData>({
    initialData: {
      name: '',
      type: 'discount',
      discountType: 'percentage',
      discountValue: 0,
      eventIds: [eventId],
      startsAt: '',
      endsAt: '',
      maxUses: 0,
    } as PromotionFormData,
    onSubmit,
  });

  useEffect(() => {
    async function loadEvents() {
      if (!currentOrganization) return;

      try {
        setLoadingEvents(true);
        const eventsData = await organizerApi.events.list({
          orgId: currentOrganization.id
        });
        setEvents(eventsData.map(e => ({ id: e.id, title: e.title })));
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, [currentOrganization]);

  const handleEventToggle = (eventIdToToggle: string) => {
    setFormData((prev) => {
      const newEventIds = prev.eventIds?.includes(eventIdToToggle)
        ? prev.eventIds.filter(id => id !== eventIdToToggle)
        : [...(prev.eventIds || []), eventIdToToggle];

      return {
        ...prev,
        eventIds: newEventIds,
      };
    });
  };

  const selectAllEvents = () => {
    setFormData((prev) => ({
      ...prev,
      eventIds: events.map(e => e.id),
    }));
  };

  const deselectAllEvents = () => {
    setFormData((prev) => ({
      ...prev,
      eventIds: [],
    }));
  };

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title="Create Promotion Campaign"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Early Bird Special"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.discountType === 'percentage' ? 'Percentage' : 'Amount (cents)'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                required
                min="0"
                max={formData.discountType === 'percentage' ? 100 : undefined}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={formData.discountType === 'percentage' ? '15' : '1000'}
              />
              {formData.discountType === 'fixed' && (
                <p className="text-xs text-muted-foreground mt-1">
                  ${toDollarString(formData.discountValue || 0)}
                </p>
              )}
            </div>
          </div>

          {/* Event Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Apply to Events <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllEvents}
                  className="text-xs text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={deselectAllEvents}
                  className="text-xs text-primary hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {loadingEvents ? (
              <div className="flex items-center justify-center py-4 border border-border rounded-md">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading events...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="border border-border rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground">No events found</p>
              </div>
            ) : (
              <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {events.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-center gap-2 p-2 hover:bg-secondary rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.eventIds?.includes(event.id) || false}
                      onChange={() => handleEventToggle(event.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm flex-1">{event.title}</span>
                    {event.id === eventId && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        Current
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formData.eventIds?.length || 0} event{formData.eventIds?.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Total Uses
            </label>
            <input
              type="number"
              name="maxUses"
              value={formData.maxUses}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0 for unlimited"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Total number of times this promotion can be used across all promo codes
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Start Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="startsAt"
              value={formData.startsAt}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              End Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="endsAt"
              value={formData.endsAt}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> After creating this promotion campaign, you can create multiple promo codes
              (like "EARLY15", "SAVE20") that will use this discount configuration.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.eventIds || formData.eventIds.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </Modal>
  );
}
