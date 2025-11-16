'use client';

import { PromoCode } from '@/lib/types/organizer';
import { Edit, Trash2, Percent, Calendar, Users } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/format';

interface PromoCodeCardProps {
  promoCode: PromoCode;
  onEdit: (promoCode: PromoCode) => void;
  onDelete: (promoCode: PromoCode) => void;
}

export function PromoCodeCard({ promoCode, onEdit, onDelete }: PromoCodeCardProps) {
  const isActive = promoCode.startsAt && promoCode.endsAt &&
                   new Date() >= new Date(promoCode.startsAt) &&
                   new Date() <= new Date(promoCode.endsAt);
  const usagePercent = promoCode.maxUses && promoCode.maxUses > 0
    ? Math.round((promoCode.redemptions / promoCode.maxUses) * 100)
    : 0;

  return (
    <div className="border border-border rounded-lg p-6 hover:border-primary/50 transition bg-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold font-mono">{promoCode.code}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${
              isActive
                ? 'bg-green-100 text-green-800 border-green-200'
                : 'bg-gray-100 text-gray-800 border-gray-200'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {promoCode.promotion && (
            <p className="text-sm text-muted-foreground">{promoCode.promotion.name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(promoCode)}
            className="p-2 hover:bg-secondary rounded-md transition"
            title="Edit promo code"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(promoCode)}
            className="p-2 hover:bg-red-50 text-red-600 rounded-md transition"
            title="Delete promo code"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Discount Info */}
      {promoCode.promotion && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-md">
          <Percent className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold text-primary">
              {promoCode.promotion.discountType === 'percentage'
                ? `${promoCode.promotion.discountValue}% off`
                : `$${(promoCode.promotion.discountValue / 100).toFixed(2)} off`}
            </p>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="w-4 h-4" />
            Usage
          </span>
          <span className="font-medium">
            {promoCode.redemptions} / {promoCode.maxUses && promoCode.maxUses > 0 ? promoCode.maxUses : '∞'}
          </span>
        </div>
        {promoCode.maxUses && promoCode.maxUses > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                usagePercent >= 90 ? 'bg-red-500' :
                usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="space-y-2 text-xs text-muted-foreground pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          <span>Starts: {promoCode.startsAt ? formatDateTime(promoCode.startsAt) : 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          <span>Ends: {promoCode.endsAt ? formatDateTime(promoCode.endsAt) : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
