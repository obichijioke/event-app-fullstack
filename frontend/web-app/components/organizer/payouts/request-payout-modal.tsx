'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { CurrencyInput } from '@/components/ui/currency-input';
import toast from 'react-hot-toast';
import type { CreatePayoutDto, FinancialSummary } from '@/lib/types/organizer';

interface RequestPayoutModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function RequestPayoutModal({ onSuccess, onCancel }: RequestPayoutModalProps) {
  const { currentOrganization } = useOrganizerStore();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [existingPayouts, setExistingPayouts] = useState(0);
  const [formData, setFormData] = useState<CreatePayoutDto>({
    amountCents: 0,
    currency: 'USD',
    scheduledFor: '',
    notes: '',
  });

  useEffect(() => {
    if (currentOrganization) {
      calculatePayout();
    }
  }, [currentOrganization]);

  const calculatePayout = async () => {
    if (!currentOrganization) return;

    setCalculating(true);
    try {
      // Get financial summary
      const summaryData = await organizerApi.financials.getSummary(currentOrganization.id);
      setSummary(summaryData);
      const summaryCurrency = summaryData.currency || summaryData.totals.currency || 'USD';

      // Check for pending payouts
      const payoutsData = await organizerApi.payouts.list(currentOrganization.id, {
        status: 'pending',
      });
      setExistingPayouts(payoutsData.length);

      // Calculate available amount (net revenue - existing payouts)
      const availableAmount = summaryData.totals.netRevenueCents - summaryData.totals.payoutsCents;

      setFormData((prev) => ({
        ...prev,
        amountCents: Math.max(0, availableAmount),
        currency: summaryCurrency,
      }));
    } catch (error: any) {
      console.error('Failed to calculate payout:', error);
      toast.error(error?.message || 'Failed to calculate available payout');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;

    const availableAmount = (summary?.totals.netRevenueCents || 0) - (summary?.totals.payoutsCents || 0);
    const canCreatePayout = existingPayouts === 0 && availableAmount > 0;

    if (!canCreatePayout) {
      toast.error('Cannot create payout at this time');
      return;
    }

    setLoading(true);
    try {
      await organizerApi.payouts.create(formData, currentOrganization.id);
      toast.success('Payout request submitted successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create payout:', error);
      toast.error(error?.message || 'Failed to create payout request');
    } finally {
      setLoading(false);
    }
  };

  const summaryCurrency = summary?.currency || summary?.totals.currency || 'USD';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold">Request Payout</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-secondary rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {calculating ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Calculating available payout...</p>
          </div>
        ) : !summary ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load payout calculation</p>
            <button
              onClick={calculatePayout}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Available Balance Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-blue-900 mb-3">
                    <CurrencyDisplay
                      amountCents={Math.max(0, summary.totals.netRevenueCents - summary.totals.payoutsCents)}
                      currency={summaryCurrency}
                      showFree={false}
                    />
                  </p>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Gross Revenue:</span>
                      <span className="font-medium">
                        <CurrencyDisplay
                          amountCents={summary.totals.grossRevenueCents}
                          currency={summaryCurrency}
                          showFree={false}
                        />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fees:</span>
                      <span className="font-medium">
                        -
                        <CurrencyDisplay
                          amountCents={summary.totals.feeCents}
                          currency={summaryCurrency}
                          showFree={false}
                        />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Already Paid Out:</span>
                      <span className="font-medium">
                        -
                        <CurrencyDisplay
                          amountCents={summary.totals.payoutsCents}
                          currency={summaryCurrency}
                          showFree={false}
                        />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Orders:</span>
                      <span className="font-medium">{summary.totals.ordersCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cannot Create Payout Warning */}
            {(existingPayouts > 0 || (summary.totals.netRevenueCents - summary.totals.payoutsCents) <= 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-900">
                  <p className="font-medium mb-1">Cannot Request Payout</p>
                  <p>
                    {existingPayouts > 0
                      ? `You have ${existingPayouts} pending payout(s). Please wait for them to complete before requesting a new payout.`
                      : 'Insufficient balance or minimum payout amount not met.'}
                  </p>
                </div>
              </div>
            )}

            {/* Payout Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Payout Amount <span className="text-red-500">*</span>
              </label>
              <CurrencyInput
                value={formData.amountCents}
                onChange={(cents) =>
                  setFormData((prev) => ({
                    ...prev,
                    amountCents: cents,
                  }))
                }
                currency={formData.currency}
                required
                placeholder="0.00"
                disabled={existingPayouts > 0 || (summary.totals.netRevenueCents - summary.totals.payoutsCents) <= 0}
              />
              <p className="text-xs text-muted-foreground mt-1">
                <CurrencyDisplay
                  amountCents={formData.amountCents}
                  currency={formData.currency}
                  showFree={false}
                />{' '}
                will be transferred to your account
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    currency: e.target.value,
                  }))
                }
                required
                disabled={existingPayouts > 0 || (summary.totals.netRevenueCents - summary.totals.payoutsCents) <= 0}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="NGN">NGN - Nigerian Naira</option>
              </select>
            </div>

            {/* Scheduled For */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Schedule For (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="date"
                  value={formData.scheduledFor}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      scheduledFor: e.target.value,
                    }))
                  }
                  min={new Date().toISOString().split('T')[0]}
                  disabled={existingPayouts > 0 || (summary.totals.netRevenueCents - summary.totals.payoutsCents) <= 0}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to process immediately
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
                disabled={existingPayouts > 0 || (summary.totals.netRevenueCents - summary.totals.payoutsCents) <= 0}
                placeholder="Add any notes about this payout request..."
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Info Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-medium mb-1">Processing Time</p>
              <p>
                Payouts are typically processed within 2-5 business days. You'll receive email notifications
                when your payout status changes.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || existingPayouts > 0 || (summary.totals.netRevenueCents - summary.totals.payoutsCents) <= 0}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Request Payout
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
