'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { useAuth } from '@/components/auth';
import { useCurrency } from '@/hooks/useCurrency';
import type { FinancialSummary } from '@/lib/types/organizer';

type Period = '7d' | '30d' | '90d';

export function RevenueChart() {
  const { currentOrganization } = useOrganizerStore();
  const { initialized: authInitialized, accessToken } = useAuth();
  const { formatAmount } = useCurrency();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');

  useEffect(() => {
    if (authInitialized && accessToken && currentOrganization) {
      loadRevenueData();
    }
  }, [authInitialized, accessToken, currentOrganization, period]);

  const loadRevenueData = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const data = await organizerApi.financials.getSummary(currentOrganization.id, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setSummary(data);
    } catch (error: any) {
      console.error('Failed to load revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!summary?.ordersByDay) return [];

    return Object.entries(summary.ordersByDay)
      .map(([date, revenueCents]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenueCents,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [summary]);

  const formatCurrency = (value: number) => formatAmount(Math.round(value));

  return (
    <div className="bg-card rounded-lg shadow-card border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Revenue Over Time</h3>
          <p className="text-sm text-muted-foreground mt-1">Daily revenue breakdown</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                period === '7d'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                period === '30d'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setPeriod('90d')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                period === '90d'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart data...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center">
          <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No Revenue Data</p>
          <p className="text-sm text-muted-foreground">
            Revenue data will appear here once you start selling tickets
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCurrency(value as number)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            />
            <Line
              type="monotone"
              dataKey="revenueCents"
              stroke="#1e40af"
              strokeWidth={2}
              dot={{ fill: '#1e40af', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
