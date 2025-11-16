'use client';

import { PromoCode, CreatePromoCodeDto, Promotion } from '@/lib/types/organizer';
import { Modal } from '@/components/ui';
import { useFormState } from '@/lib/hooks';
import { toDateTimeInput } from '@/lib/utils';

interface PromoCodeFormProps {
  promoCode?: PromoCode;
  promotions: Promotion[];
  onSubmit: (data: CreatePromoCodeDto) => Promise<void>;
  onCancel: () => void;
}

export function PromoCodeForm({ promoCode, promotions, onSubmit, onCancel }: PromoCodeFormProps) {
  const { formData, loading, handleChange, handleSubmit } = useFormState({
    initialData: {
      code: promoCode?.code || '',
      promotionId: promoCode?.promotionId || '',
      maxUses: promoCode?.maxUses || 0,
      startsAt: promoCode?.startsAt || '',
      endsAt: promoCode?.endsAt || '',
    },
    onSubmit,
  });

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title={promoCode ? 'Edit Promo Code' : 'Create Promo Code'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Promo Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono uppercase"
              placeholder="e.g., EARLY15"
              pattern="[A-Z0-9]+"
              title="Use only uppercase letters and numbers"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use uppercase letters and numbers only
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Promotion Campaign <span className="text-red-500">*</span>
            </label>
            <select
              name="promotionId"
              value={formData.promotionId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a promotion...</option>
              {promotions.map((promo) => (
                <option key={promo.id} value={promo.id}>
                  {promo.name} ({promo.discountType === 'percentage' ? `${promo.discountValue}%` : `$${(promo.discountValue / 100).toFixed(2)}`} off)
                </option>
              ))}
            </select>
            {promotions.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                Create a promotion campaign first
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Uses
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
              Leave 0 for unlimited uses
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Start Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="startsAt"
              value={toDateTimeInput(formData.startsAt)}
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
              value={toDateTimeInput(formData.endsAt)}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
              disabled={loading || promotions.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : promoCode ? 'Update Code' : 'Create Code'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }
