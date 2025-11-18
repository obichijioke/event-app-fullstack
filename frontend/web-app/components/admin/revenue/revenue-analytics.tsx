'use client';

import * as React from 'react';
import { Text } from '@/components/ui';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { adminApiService, type AdminRevenueMetrics } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface RevenueAnalyticsProps {
  className?: string;
}

export function RevenueAnalytics({ className }: RevenueAnalyticsProps) {
  const { accessToken } = useAuth();
  const [metrics, setMetrics] = React.useState<AdminRevenueMetrics | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!accessToken) return;
    loadMetrics();
  }, [accessToken]);

  const loadMetrics = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getRevenueMetrics(accessToken, {});
      if (response.success && response.data) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Failed to load revenue metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!metrics) {
    return <div>No revenue data available</div>;
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Revenue Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform revenue analytics and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <Text className="text-sm text-muted-foreground">Total Revenue</Text>
          <Text className="text-2xl font-bold mt-2">
            <CurrencyDisplay
              amountCents={metrics.totalRevenueCents}
              currency={metrics.currency}
              showFree={false}
            />
          </Text>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <Text className="text-sm text-muted-foreground">Platform Fees</Text>
          <Text className="text-2xl font-bold mt-2">
            <CurrencyDisplay
              amountCents={metrics.platformFeeCents}
              currency={metrics.currency}
              showFree={false}
            />
          </Text>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <Text className="text-sm text-muted-foreground">Processing Fees</Text>
          <Text className="text-2xl font-bold mt-2">
            <CurrencyDisplay
              amountCents={metrics.processingFeeCents}
              currency={metrics.currency}
              showFree={false}
            />
          </Text>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <Text className="text-sm text-muted-foreground">Organizer Payouts</Text>
          <Text className="text-2xl font-bold mt-2">
            <CurrencyDisplay
              amountCents={metrics.organizerPayoutCents}
              currency={metrics.currency}
              showFree={false}
            />
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <Text className="text-sm text-muted-foreground">Total Orders</Text>
          <Text className="text-2xl font-bold mt-2">{metrics.orderCount.toLocaleString()}</Text>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <Text className="text-sm text-muted-foreground">Total Tickets</Text>
          <Text className="text-2xl font-bold mt-2">{metrics.ticketCount.toLocaleString()}</Text>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <Text className="text-sm text-muted-foreground">Refunds</Text>
          <Text className="text-2xl font-bold mt-2">
            <CurrencyDisplay
              amountCents={metrics.refundAmountCents}
              currency={metrics.currency}
              showFree={false}
            />
          </Text>
          <Text className="text-xs text-muted-foreground mt-1">({metrics.refundCount} refunds)</Text>
        </div>
      </div>
    </div>
  );
}
