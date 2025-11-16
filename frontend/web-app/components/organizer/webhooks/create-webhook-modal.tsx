'use client';

import { useState } from 'react';
import { X, Webhook as WebhookIcon, AlertCircle } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import toast from 'react-hot-toast';

interface CreateWebhookModalProps {
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

export function CreateWebhookModal({ onClose, onSuccess }: CreateWebhookModalProps) {
  const { currentOrganization } = useOrganizerStore();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [eventFilters, setEventFilters] = useState<string[]>([]);
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

    if (eventFilters.length === 0) {
      if (!confirm('No events selected. This webhook will receive all events. Continue?')) {
        return;
      }
    }

    setLoading(true);
    try {
      await organizerApi.webhooks.create(currentOrganization.id, {
        url: url.trim(),
        description: description.trim() || undefined,
        eventFilters,
        active: true,
      });
      toast.success('Webhook created successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create webhook:', error);
      toast.error(error?.message || 'Failed to create webhook');
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
          <h2 className="text-2xl font-bold">Create Webhook</h2>
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
            <p className="text-sm text-muted-foreground mt-1">
              The URL where EventFlow will send event notifications
            </p>
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
            <p className="text-sm text-muted-foreground mt-1">
              A description to help identify this webhook
            </p>
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

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Webhook Security</p>
              <p>
                Each webhook request will include a signature in the{' '}
                <code className="bg-blue-100 px-1 rounded">X-Webhook-Signature</code> header.
                Verify this signature on your server to ensure requests are authentic.
              </p>
            </div>
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
                  Creating...
                </>
              ) : (
                <>
                  <WebhookIcon className="w-4 h-4" />
                  Create Webhook
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
