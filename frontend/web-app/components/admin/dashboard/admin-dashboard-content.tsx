'use client';

import * as React from 'react';
import Link from 'next/link';
import { MetricsGrid, RevenueChart, ActivityFeed } from '@/components/admin';
import { UsersIcon, CalendarIcon, CurrencyIcon, TrendingUpIcon } from '@/components/ui/icons';
import { useAuth } from '@/components/auth';
import { adminApiService, type AdminMetrics, type AdminActivityLog } from '@/services/admin-api.service';
import { Text } from '@/components/ui';
import { CurrencyDisplay } from '@/components/common/currency-display';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface Activity {
  id: string;
  type: 'user' | 'event' | 'order' | 'payment' | 'system';
  title: string;
  description: string;
  userName?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export function AdminDashboardContent() {
  const { accessToken } = useAuth();
  const [metrics, setMetrics] = React.useState<AdminMetrics | null>(null);
  const [revenueData, setRevenueData] = React.useState<RevenueDataPoint[]>([]);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accessToken) return;

    loadDashboardData();
  }, [accessToken]);

  const loadDashboardData = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      // Load metrics
      const metricsResponse = await adminApiService.getMetrics(accessToken);
      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data);
      }

      // Load recent audit logs for activity feed
      const logsResponse = await adminApiService.getAuditLogs(accessToken, {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (logsResponse.success && logsResponse.data) {
        const mappedActivities = logsResponse.data.data.map(log => mapAuditLogToActivity(log));
        setActivities(mappedActivities);
      }

      // TODO: Load revenue data from a dedicated endpoint when available
      // For now, we'll use empty array or fetch from orders endpoint
      setRevenueData([]);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const mapAuditLogToActivity = (log: AdminActivityLog): Activity => {
    const activityType = getActivityType(log.action, log.targetKind);
    const title = getActivityTitle(log.action, log.targetKind);
    const description = getActivityDescription(log);

    return {
      id: log.id,
      type: activityType,
      title,
      description,
      userName: log.actorName,
      timestamp: new Date(log.createdAt),
      metadata: log.meta,
    };
  };

  const getActivityType = (action: string, targetKind: string): Activity['type'] => {
    if (targetKind === 'user') return 'user';
    if (targetKind === 'event') return 'event';
    if (targetKind === 'order') return 'order';
    if (targetKind === 'payment') return 'payment';
    return 'system';
  };

  const getActivityTitle = (action: string, targetKind: string): string => {
    const actionMap: Record<string, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      login: 'Logged In',
      logout: 'Logged Out',
      approve: 'Approved',
      reject: 'Rejected',
      suspend: 'Suspended',
      activate: 'Activated',
    };

    const actionText = actionMap[action] || action;
    const targetText = targetKind.charAt(0).toUpperCase() + targetKind.slice(1);

    return `${targetText} ${actionText}`;
  };

  const getActivityDescription = (log: AdminActivityLog): string => {
    const actor = log.actorName || 'System';
    const target = log.targetKind;
    const action = log.action;

    return `${actor} ${action}d ${target}`;
  };

  const metricsCards = React.useMemo(() => {
    if (!metrics) return [];

    return [
      {
        title: 'Total Users',
        value: metrics.totalUsers,
        change: metrics.userGrowth !== 0 ? {
          value: Math.abs(metrics.userGrowth),
          type: metrics.userGrowth >= 0 ? 'increase' as const : 'decrease' as const,
          period: 'last 30 days',
        } : undefined,
        icon: <UsersIcon className="h-6 w-6 text-primary" />,
      },
      {
        title: 'Active Events',
        value: metrics.activeEvents,
        change: metrics.eventGrowth !== 0 ? {
          value: Math.abs(metrics.eventGrowth),
          type: metrics.eventGrowth >= 0 ? 'increase' as const : 'decrease' as const,
          period: 'last 30 days',
        } : undefined,
        icon: <CalendarIcon className="h-6 w-6 text-primary" />,
      },
      {
        title: 'Total Revenue',
        value: (
          <CurrencyDisplay
            amountCents={metrics.totalRevenue || 0}
            currency={(metrics as any)?.currency || 'NGN'}
            showFree={false}
          />
        ),
        change: metrics.revenueGrowth !== 0 ? {
          value: Math.abs(metrics.revenueGrowth),
          type: metrics.revenueGrowth >= 0 ? 'increase' as const : 'decrease' as const,
          period: 'last 30 days',
        } : undefined,
        icon: <CurrencyIcon className="h-6 w-6 text-primary" />,
      },
      {
        title: 'Conversion Rate',
        value: `${metrics.conversionRate.toFixed(1)}%`,
        icon: <TrendingUpIcon className="h-6 w-6 text-primary" />,
      },
    ];
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Text className="text-muted-foreground">Loading dashboard...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Text className="text-destructive">Error loading dashboard</Text>
        <Text className="text-sm text-muted-foreground">{error}</Text>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform metrics and system health</p>
      </div>

      {/* Metrics Grid */}
      {metricsCards.length > 0 && <MetricsGrid metrics={metricsCards} />}

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        {revenueData.length > 0 ? (
          <RevenueChart data={revenueData} period="Last 7 days" />
        ) : (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Revenue Overview</h2>
            <div className="flex items-center justify-center h-[300px]">
              <Text className="text-muted-foreground">Revenue data will be available soon</Text>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {activities.length > 0 ? (
          <ActivityFeed activities={activities} />
        ) : (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h2>
            <div className="flex items-center justify-center h-[300px]">
              <Text className="text-muted-foreground">No recent activity</Text>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 rounded-md border border-border bg-background p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <UsersIcon className="h-4 w-4" />
            Manage Users
          </Link>
          <Link
            href="/admin/events"
            className="flex items-center gap-2 rounded-md border border-border bg-background p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <CalendarIcon className="h-4 w-4" />
            Review Events
          </Link>
          <Link
            href="/admin/payments"
            className="flex items-center gap-2 rounded-md border border-border bg-background p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <CurrencyIcon className="h-4 w-4" />
            View Payments
          </Link>
          <Link
            href="/admin/audit-logs"
            className="flex items-center gap-2 rounded-md border border-border bg-background p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <TrendingUpIcon className="h-4 w-4" />
            View Audit Logs
          </Link>
        </div>
      </div>
    </div>
  );
}

