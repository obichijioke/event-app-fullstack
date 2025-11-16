'use client';

import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({ title, value, change, icon: Icon, iconColor = 'text-primary' }: MetricCardProps) {
  const isPositive = change && change.value > 0;
  const isNegative = change && change.value < 0;

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-3xl font-bold">{value}</p>
        {change && (
          <p className="text-sm mt-2">
            <span
              className={`font-medium ${
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
              }`}
            >
              {isPositive && '+'}
              {change.value}%
            </span>
            <span className="text-muted-foreground ml-1">{change.label}</span>
          </p>
        )}
      </div>
    </div>
  );
}
