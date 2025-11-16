'use client';

import { Promotion, PromoCode } from '@/lib/types/organizer';
import { X, TrendingUp, Tag, DollarSign, Users, Award, Calendar } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils/format';

interface CampaignAnalyticsModalProps {
  promotion: Promotion;
  promoCodes: PromoCode[];
  onClose: () => void;
}

export function CampaignAnalyticsModal({ promotion, promoCodes, onClose }: CampaignAnalyticsModalProps) {
  // Filter promo codes for this campaign
  const campaignCodes = promoCodes.filter(code => code.promotionId === promotion.id);

  // Calculate analytics
  const totalRedemptions = campaignCodes.reduce((sum, code) => sum + code.redemptions, 0);
  const activeCodesCount = campaignCodes.filter(code => {
    if (!code.startsAt || !code.endsAt) return false;
    const now = new Date();
    return now >= new Date(code.startsAt) && now <= new Date(code.endsAt);
  }).length;

  // Sort codes by redemptions
  const topCodes = [...campaignCodes]
    .sort((a, b) => b.redemptions - a.redemptions)
    .slice(0, 5);

  // Calculate usage rate
  const usageRate = promotion.maxUses && promotion.maxUses > 0
    ? Math.round(((promotion.currentUses || 0) / promotion.maxUses) * 100)
    : 0;

  // Days active
  const startDate = promotion.startsAt ? new Date(promotion.startsAt) : new Date();
  const endDate = promotion.endsAt ? new Date(promotion.endsAt) : new Date();
  const now = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.min(
    Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    totalDays
  ));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  // Average redemptions per code
  const avgRedemptionsPerCode = campaignCodes.length > 0
    ? (totalRedemptions / campaignCodes.length).toFixed(1)
    : '0';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Campaign Analytics</h2>
              <p className="text-sm text-muted-foreground">{promotion.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-blue-900 font-medium">Total Redemptions</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{promotion.currentUses || 0}</p>
            </div>

            <div className="border border-border rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-900 font-medium">Active Codes</p>
              </div>
              <p className="text-2xl font-bold text-green-900">{activeCodesCount}</p>
              <p className="text-xs text-green-700 mt-1">of {campaignCodes.length} total</p>
            </div>

            <div className="border border-border rounded-lg p-4 bg-purple-50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-purple-900 font-medium">Usage Rate</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {promotion.maxUses && promotion.maxUses > 0 ? `${usageRate}%` : '∞'}
              </p>
            </div>

            <div className="border border-border rounded-lg p-4 bg-amber-50">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-amber-900 font-medium">Avg/Code</p>
              </div>
              <p className="text-2xl font-bold text-amber-900">{avgRedemptionsPerCode}</p>
            </div>
          </div>

          {/* Discount Info */}
          <div className="border border-border rounded-lg p-4 bg-primary/5">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Discount Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Discount Value</p>
                <p className="font-semibold text-primary text-lg">
                  {promotion.discountType === 'percentage'
                    ? `${promotion.discountValue}%`
                    : formatCurrency(promotion.discountValue)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Discount Type</p>
                <p className="font-semibold">
                  {promotion.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              Campaign Timeline
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Days Elapsed</p>
                  <p className="font-semibold text-lg">{daysElapsed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Days Remaining</p>
                  <p className="font-semibold text-lg">{daysRemaining}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Duration</p>
                  <p className="font-semibold text-lg">{totalDays} days</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min((daysElapsed / totalDays) * 100, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{promotion.startsAt ? formatDateTime(promotion.startsAt) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">{promotion.endsAt ? formatDateTime(promotion.endsAt) : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Codes */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-muted-foreground" />
              Top Performing Codes
            </h3>
            {topCodes.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No promo codes have been redeemed yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {topCodes.map((code, index) => {
                  const codeUsagePercent = code.maxUses && code.maxUses > 0
                    ? Math.round((code.redemptions / code.maxUses) * 100)
                    : 0;

                  return (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-3 border border-border rounded-md bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-200 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-50 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-mono font-semibold">{code.code}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{code.redemptions} uses</p>
                          {code.maxUses && code.maxUses > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {codeUsagePercent}% of limit
                            </p>
                          )}
                        </div>
                        {code.maxUses && code.maxUses > 0 && (
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                codeUsagePercent >= 90 ? 'bg-red-500' :
                                codeUsagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(codeUsagePercent, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Campaign Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-blue-900">
              <div>
                <p className="text-blue-700">Total Codes Created:</p>
                <p className="font-semibold">{campaignCodes.length}</p>
              </div>
              <div>
                <p className="text-blue-700">Total Redemptions:</p>
                <p className="font-semibold">{totalRedemptions}</p>
              </div>
              <div>
                <p className="text-blue-700">Campaign Redemptions:</p>
                <p className="font-semibold">{promotion.currentUses || 0}</p>
              </div>
              <div>
                <p className="text-blue-700">Max Uses:</p>
                <p className="font-semibold">
                  {promotion.maxUses && promotion.maxUses > 0 ? promotion.maxUses : 'Unlimited'}
                </p>
              </div>
            </div>
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
