'use client';

import { TicketType, CreateTicketTypeDto } from '@/lib/types/organizer';
import { Modal } from '@/components/ui';
import { useFormState } from '@/lib/hooks';
import { toDateTimeInput, toDollarString } from '@/lib/utils';

interface TicketTypeFormProps {
  ticketType?: TicketType;
  onSubmit: (data: CreateTicketTypeDto) => Promise<void>;
  onCancel: () => void;
}

export function TicketTypeForm({ ticketType, onSubmit, onCancel }: TicketTypeFormProps) {
  const { formData, loading, handleChange, handleSubmit } = useFormState({
    initialData: {
      name: ticketType?.name || '',
      kind: ticketType?.kind || 'GA',
      currency: ticketType?.currency || 'USD',
      priceCents: ticketType?.priceCents || 0,
      feeCents: ticketType?.feeCents || 0,
      capacity: ticketType?.capacity || 100,
      salesStart: ticketType?.salesStart || '',
      salesEnd: ticketType?.salesEnd || '',
      status: ticketType?.status || 'active',
    },
    onSubmit,
  });

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title={ticketType ? 'Edit Ticket Type' : 'Create Ticket Type'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ticket Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., VIP Pass"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Visible anywhere this ticket is shown to attendees.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ticket Type <span className="text-red-500">*</span>
              </label>
              <select
                name="kind"
                value={formData.kind}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="GENERAL">General Admission</option>
                <option value="SEATED">Seated</option>
                <option value="VIP">VIP</option>
                <option value="EARLY_BIRD">Early Bird</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Helps you report on tickets by category.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Price (cents) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="priceCents"
                value={formData.priceCents}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="5000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ${toDollarString(formData.priceCents || 0)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Fee (cents)
              </label>
              <input
                type="number"
                name="feeCents"
                value={formData.feeCents}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="250"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ${toDollarString(formData.feeCents || 0)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="NGN">NGN</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Sets the currency customers pay with.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total number of tickets available for this type.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="sold_out">Sold Out</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Inactive tickets are hidden from checkout.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Sales Start
              </label>
              <input
                type="datetime-local"
                name="salesStart"
                value={toDateTimeInput(formData.salesStart)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to begin selling immediately.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Sales End
              </label>
              <input
                type="datetime-local"
                name="salesEnd"
                value={toDateTimeInput(formData.salesEnd)}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to sell right up until the event starts.
              </p>
            </div>
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
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : ticketType ? 'Update Ticket Type' : 'Create Ticket Type'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }
