import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: ReactNode | string | number;
  subtext?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: ReactNode;
  loading?: boolean;
}

export function MetricCard({ label, value, subtext, trend, icon, loading }: MetricCardProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>

      {(subtext || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
          )}
          {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
      )}
    </div>
  );
}
