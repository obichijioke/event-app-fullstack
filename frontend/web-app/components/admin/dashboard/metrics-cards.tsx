'use client';

import * as React from 'react';
import { Text, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, change, icon, className }: MetricCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Text className="text-sm font-medium text-muted-foreground">{title}</Text>
          <div className="mt-2 flex items-baseline gap-2">
            <Text className="text-2xl font-bold text-foreground">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
            {change && (
              <Badge
                variant={change.type === 'increase' ? 'success' : 'error'}
                size="sm"
                className="text-xs"
              >
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </Badge>
            )}
          </div>
          {change && (
            <Text className="mt-1 text-xs text-muted-foreground">
              {change.type === 'increase' ? 'Increased' : 'Decreased'} by {change.period}
            </Text>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricsGridProps {
  metrics: MetricCardProps[];
  className?: string;
}

export function MetricsGrid({ metrics, className }: MetricsGridProps) {
  return (
    <div className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-4', className)}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}