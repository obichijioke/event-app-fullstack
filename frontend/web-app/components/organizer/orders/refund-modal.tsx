'use client';

import { useState } from 'react';
import { OrderDetail, RefundDto } from '@/lib/types/organizer';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { CurrencyInput } from '@/components/ui/currency-input';
import { X, AlertTriangle } from 'lucide-react';

interface RefundModalProps {
  order: OrderDetail;
  onSubmit: (data: RefundDto) => Promise<void>;
  onCancel: () => void;
}

export function RefundModal({ order, onSubmit, onCancel }: RefundModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RefundDto>({
    amountCents: order.totalCents,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Refund Order</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-secondary rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium mb-1">Refund Confirmation</p>
              <p>
                This action will process a refund through the payment provider and cannot be undone.
                Associated tickets will be marked as refunded.
              </p>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono font-medium">{order.id}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Buyer:</span>
              <span className="font-medium">{order.buyer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold">
                <CurrencyDisplay amountCents={order.totalCents} currency={order.currency} showFree={false} />
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Refund Amount <span className="text-red-500">*</span>
            </label>
            <CurrencyInput
              value={formData.amountCents}
              onChange={(cents) =>
                setFormData((prev) => ({
                  ...prev,
                  amountCents: Math.min(cents, order.totalCents), // Ensure it doesn't exceed order total
                }))
              }
              currency={order.currency}
              required
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum refund:{' '}
              <CurrencyDisplay amountCents={order.totalCents} currency={order.currency} showFree={false} />
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              required
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Explain why this refund is being issued..."
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
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Process Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
