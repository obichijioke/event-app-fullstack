'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, AlertCircle } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { useAuth } from '@/components/auth';
import { ExportOrdersButton } from '@/components/organizer/financials/export-orders-button';
import Link from 'next/link';
import type { FinancialSummary } from '@/lib/types/organizer';

interface FinancialMetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: { value: string; isPositive: boolean };
  loading?: boolean;
}

function FinancialMetricCard({ label, value, icon, trend, loading }: FinancialMetricCardProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-card border border-border p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-secondary rounded-lg" />
          <div className="w-16 h-4 bg-secondary rounded" />
        </div>
        <div className="w-24 h-8 bg-secondary rounded mb-2" />
        <div className="w-32 h-4 bg-secondary rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-card border border-border p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export function FinancialSummaryWidget() {
  const { currentOrganization } = useOrganizerStore();
  const { initialized: authInitialized, accessToken } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authInitialized && accessToken && currentOrganization) {
      loadFinancialSummary();
    }
  }, [authInitialized, accessToken, currentOrganization]);

  const loadFinancialSummary = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    setError(null);
    try {
      const data = await organizerApi.financials.getSummary(currentOrganization.id);
      setSummary(data);
    } catch (error: any) {
      console.error('Failed to load financial summary:', error);
      setError(error?.message || 'Failed to load financial data');
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

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow-card border border-border p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to Load Financial Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={loadFinancialSummary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Overview</h2>
          <p className="text-muted-foreground mt-1">Track your revenue, fees, and payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportOrdersButton variant="secondary" />
          <Link
            href="/organizer/payouts"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
          >
            View All Payouts
          </Link>
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialMetricCard
          label="Gross Revenue"
          value={loading ? '...' : formatCurrency(summary?.totals.grossRevenueCents || 0)}
          icon={<DollarSign className="w-5 h-5" />}
          loading={loading}
        />
        <FinancialMetricCard
          label="Net Revenue"
          value={loading ? '...' : formatCurrency(summary?.totals.netRevenueCents || 0)}
          icon={<TrendingUp className="w-5 h-5" />}
          loading={loading}
        />
        <FinancialMetricCard
          label="Platform Fees"
          value={loading ? '...' : formatCurrency(summary?.totals.feeCents || 0)}
          icon={<CreditCard className="w-5 h-5" />}
          loading={loading}
        />
        <FinancialMetricCard
          label="Total Payouts"
          value={loading ? '...' : formatCurrency(summary?.totals.payoutsCents || 0)}
          icon={<Receipt className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Orders</span>
          </div>
          <div className="text-2xl font-bold">
            {loading ? (
              <div className="w-16 h-8 bg-secondary rounded animate-pulse" />
            ) : (
              summary?.totals.ordersCount.toLocaleString() || 0
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Tickets Sold</span>
          </div>
          <div className="text-2xl font-bold">
            {loading ? (
              <div className="w-16 h-8 bg-secondary rounded animate-pulse" />
            ) : (
              summary?.totals.ticketsSold.toLocaleString() || 0
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Refunds</span>
          </div>
          <div className="text-2xl font-bold text-destructive">
            {loading ? (
              <div className="w-16 h-8 bg-secondary rounded animate-pulse" />
            ) : (
              formatCurrency(summary?.totals.refundCents || 0)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
