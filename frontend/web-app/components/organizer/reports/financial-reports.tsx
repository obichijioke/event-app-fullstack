'use client';

import { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, Download, FileText, BarChart3 } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { useAuth } from '@/components/auth';
import { ExportOrdersButton } from '@/components/organizer/financials/export-orders-button';
import type { FinancialSummary } from '@/lib/types/organizer';

type ReportPeriod = '7d' | '30d' | '90d' | 'custom';

export function FinancialReports() {
  const { currentOrganization } = useOrganizerStore();
  const { initialized: authInitialized, accessToken } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    if (authInitialized && accessToken && currentOrganization) {
      loadFinancialSummary();
    }
  }, [authInitialized, accessToken, currentOrganization, period, customStartDate, customEndDate]);

  const loadFinancialSummary = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (period === 'custom') {
        // Convert YYYY-MM-DD to ISO string
        startDate = customStartDate ? new Date(customStartDate).toISOString() : undefined;
        endDate = customEndDate ? new Date(customEndDate).toISOString() : undefined;
      } else {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);

        startDate = start.toISOString();
        endDate = end.toISOString();
      }

      const data = await organizerApi.financials.getSummary(currentOrganization.id, {
        startDate,
        endDate,
      });
      setSummary(data);
    } catch (error: any) {
      console.error('Failed to load financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatPercentage = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%';
    return ((numerator / denominator) * 100).toFixed(1) + '%';
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-card rounded-lg shadow-card border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Report Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Select */}
          <div>
            <label className="block text-sm font-medium mb-2">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setPeriod('7d')}
                className={`px-4 py-2 rounded-lg border transition ${
                  period === '7d'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-secondary'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setPeriod('30d')}
                className={`px-4 py-2 rounded-lg border transition ${
                  period === '30d'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-secondary'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setPeriod('90d')}
                className={`px-4 py-2 rounded-lg border transition ${
                  period === '90d'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-secondary'
                }`}
              >
                Last 90 Days
              </button>
              <button
                onClick={() => setPeriod('custom')}
                className={`px-4 py-2 rounded-lg border transition ${
                  period === 'custom'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-secondary'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate || undefined}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate || undefined}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mb-1">
            {loading ? '...' : formatCurrency(summary?.totals.grossRevenueCents || 0)}
          </div>
          <div className="text-sm text-muted-foreground">Gross Revenue</div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold mb-1">
            {loading ? '...' : formatCurrency(summary?.totals.netRevenueCents || 0)}
          </div>
          <div className="text-sm text-muted-foreground">Net Revenue</div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">
            {loading ? '...' : summary?.totals.ordersCount.toLocaleString() || 0}
          </div>
          <div className="text-sm text-muted-foreground">Total Orders</div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">
            {loading ? '...' : summary?.totals.ticketsSold.toLocaleString() || 0}
          </div>
          <div className="text-sm text-muted-foreground">Tickets Sold</div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-card rounded-lg shadow-card border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Revenue Breakdown</h3>
          <ExportOrdersButton variant="secondary" />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-secondary rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
              <div>
                <p className="font-medium">Gross Revenue</p>
                <p className="text-sm text-muted-foreground">Total sales before fees and refunds</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{formatCurrency(summary?.totals.grossRevenueCents || 0)}</p>
                <p className="text-sm text-muted-foreground">100%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
              <div>
                <p className="font-medium">Platform Fees</p>
                <p className="text-sm text-muted-foreground">Service and processing fees</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-red-600">
                  -{formatCurrency(summary?.totals.feeCents || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatPercentage(
                    summary?.totals.feeCents || 0,
                    summary?.totals.grossRevenueCents || 0
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
              <div>
                <p className="font-medium">Refunds</p>
                <p className="text-sm text-muted-foreground">Customer refunds issued</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-red-600">
                  -{formatCurrency(summary?.totals.refundCents || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatPercentage(
                    summary?.totals.refundCents || 0,
                    summary?.totals.grossRevenueCents || 0
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="font-bold text-green-900">Net Revenue</p>
                <p className="text-sm text-green-700">Amount available for payout</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(summary?.totals.netRevenueCents || 0)}
                </p>
                <p className="text-sm text-green-700">
                  {formatPercentage(
                    summary?.totals.netRevenueCents || 0,
                    summary?.totals.grossRevenueCents || 0
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payout Summary */}
      <div className="bg-card rounded-lg shadow-card border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Payout Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 mb-1">Total Payouts</p>
            <p className="text-2xl font-bold text-blue-900">
              {loading ? '...' : formatCurrency(summary?.totals.payoutsCents || 0)}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-900 mb-1">Pending Payout</p>
            <p className="text-2xl font-bold text-amber-900">
              {loading
                ? '...'
                : formatCurrency(
                    (summary?.totals.netRevenueCents || 0) - (summary?.totals.payoutsCents || 0)
                  )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
