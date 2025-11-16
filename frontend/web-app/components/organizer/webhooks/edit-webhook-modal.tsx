'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import toast from 'react-hot-toast';
import type { Webhook } from '@/lib/types/organizer';

interface EditWebhookModalProps {
  webhook: Webhook;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_EVENTS = [
  { value: 'order.created', label: 'Order Created', description: 'When a new order is placed' },
  { value: 'order.paid', label: 'Order Paid', description: 'When payment is confirmed' },
  { value: 'order.refunded', label: 'Order Refunded', description: 'When an order is refunded' },
  { value: 'ticket.issued', label: 'Ticket Issued', description: 'When tickets are generated' },
  { value: 'ticket.transferred', label: 'Ticket Transferred', description: 'When a ticket is transferred' },
  { value: 'ticket.checked_in', label: 'Ticket Checked In', description: 'When an attendee checks in' },
  { value: 'event.created', label: 'Event Created', description: 'When a new event is created' },
  { value: 'event.updated', label: 'Event Updated', description: 'When an event is modified' },
  { value: 'event.published', label: 'Event Published', description: 'When an event goes live' },
];

export function EditWebhookModal({ webhook, onClose, onSuccess }: EditWebhookModalProps) {
  const { currentOrganization } = useOrganizerStore();
  const [url, setUrl] = useState(webhook.url);
  const [description, setDescription] = useState(webhook.description || '');
  const [eventFilters, setEventFilters] = useState<string[]>(webhook.eventFilters);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    if (!url.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    try {
      await organizerApi.webhooks.update(currentOrganization.id, webhook.id, {
        url: url.trim(),
        description: description.trim() || undefined,
        eventFilters,
      });
      toast.success('Webhook updated successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to update webhook:', error);
      toast.error(error?.message || 'Failed to update webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleEventToggle = (event: string) => {
    setEventFilters((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Edit Webhook</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* URL Field */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Webhook URL *
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-domain.com/webhooks"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Production Server, Slack Integration"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Event Filters */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Events to Subscribe To
            </label>
            <p className="text-sm text-muted-foreground mb-3">
              Select which events should trigger this webhook (leave empty for all events)
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3">
              {AVAILABLE_EVENTS.map((event) => (
                <label
                  key={event.value}
                  className="flex items-start gap-3 p-3 hover:bg-secondary/50 rounded cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={eventFilters.includes(event.value)}
                    onChange={() => handleEventToggle(event.value)}
                    className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{event.label}</div>
                    <div className="text-xs text-muted-foreground">{event.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {eventFilters.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {eventFilters.length} event{eventFilters.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
