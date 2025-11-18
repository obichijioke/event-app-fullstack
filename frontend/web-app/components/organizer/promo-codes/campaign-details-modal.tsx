'use client';

import { Promotion, PromoCode } from '@/lib/types/organizer';
import { X, Tag, Percent, Calendar, Users, TrendingUp } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/format';
import { CurrencyDisplay } from '@/components/common/currency-display';

interface CampaignDetailsModalProps {
  promotion: Promotion;
  promoCodes: PromoCode[];
  onClose: () => void;
}

export function CampaignDetailsModal({ promotion, promoCodes, onClose }: CampaignDetailsModalProps) {
  const isActive = promotion.startsAt && promotion.endsAt &&
                   new Date() >= new Date(promotion.startsAt) &&
                   new Date() <= new Date(promotion.endsAt);
  const usagePercent = promotion.maxUses && promotion.maxUses > 0
    ? Math.round(((promotion.currentUses || 0) / promotion.maxUses) * 100)
    : 0;

  // Filter promo codes for this campaign
  const campaignCodes = promoCodes.filter(code => code.promotionId === promotion.id);
  const totalRedemptions = campaignCodes.reduce((sum, code) => sum + code.redemptions, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold">{promotion.name}</h2>
              <span className={`px-2 py-1 rounded text-xs font-medium border ${
                isActive
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
              }`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Campaign Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campaign Info */}
        <div className="p-6 space-y-6">
          {/* Discount Info */}
          <div className="border border-border rounded-lg p-4 bg-primary/5">
            <div className="flex items-center gap-3 mb-2">
              <Percent className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Discount</h3>
            </div>
            <p className="text-2xl font-bold text-primary">
              {promotion.discountType === 'percentage'
                ? `${promotion.discountValue}% off`
                : (
                  <>
                    <CurrencyDisplay
                      amountCents={promotion.discountValue}
                      currency={(promotion as any).currency || 'USD'}
                      showFree={false}
                    />{' '}
                    off
                  </>
                )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Type: {promotion.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
            </p>
          </div>

          {/* Usage Stats */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Usage Statistics</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Campaign Redemptions</span>
                  <span className="font-medium">
                    {promotion.currentUses || 0} / {promotion.maxUses && promotion.maxUses > 0 ? promotion.maxUses : '∞'}
                  </span>
                </div>
                {promotion.maxUses && promotion.maxUses > 0 && (
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
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Total Promo Codes</p>
                  <p className="text-lg font-semibold">{campaignCodes.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Redemptions</p>
                  <p className="text-lg font-semibold">{totalRedemptions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Active Period</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Starts:</span>{' '}
                <span className="font-medium">{promotion.startsAt ? formatDateTime(promotion.startsAt) : 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ends:</span>{' '}
                <span className="font-medium">{promotion.endsAt ? formatDateTime(promotion.endsAt) : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Promo Codes List */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Tag className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Promo Codes ({campaignCodes.length})</h3>
            </div>
            {campaignCodes.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No promo codes created for this campaign yet
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {campaignCodes.map((code) => {
                  const codeActive = code.startsAt && code.endsAt &&
                                    new Date() >= new Date(code.startsAt) &&
                                    new Date() <= new Date(code.endsAt);
                  return (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-3 border border-border rounded-md bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold">{code.code}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          codeActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {codeActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {code.redemptions} / {code.maxUses && code.maxUses > 0 ? code.maxUses : '∞'}
                        </p>
                        <p className="text-xs text-muted-foreground">uses</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
