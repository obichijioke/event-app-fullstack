import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function StatCard({ title, children, action, className = '' }: StatCardProps) {
  return (
    <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
