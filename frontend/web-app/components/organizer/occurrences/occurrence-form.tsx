'use client';

import { CreateOccurrenceDto } from '@/lib/types/organizer';
import { Modal } from '@/components/ui';
import { useFormState } from '@/lib/hooks';

interface OccurrenceFormProps {
  onSubmit: (data: CreateOccurrenceDto) => Promise<void>;
  onCancel: () => void;
}

export function OccurrenceForm({ onSubmit, onCancel }: OccurrenceFormProps) {
  const { formData, loading, handleChange, handleSubmit } = useFormState({
    initialData: {
      startsAt: '',
      endsAt: '',
      gateOpenAt: '',
    },
    onSubmit,
  });

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title="Add Event Occurrence"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label className="block text-sm font-medium mb-2">
            Gates Open At (Optional)
          </label>
          <input
            type="datetime-local"
            name="gateOpenAt"
            value={formData.gateOpenAt}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty if same as start time
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
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Occurrence'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
