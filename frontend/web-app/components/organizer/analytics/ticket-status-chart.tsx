'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface TicketStatusData {
  issued: number;
  checked_in: number;
  refunded: number;
  transferred?: number;
}

interface TicketStatusChartProps {
  data: TicketStatusData;
}

const COLORS = {
  issued: '#3b82f6', // blue
  checked_in: '#10b981', // green
  refunded: '#ef4444', // red
  transferred: '#f59e0b', // amber
};

const STATUS_LABELS = {
  issued: 'Issued',
  checked_in: 'Checked In',
  refunded: 'Refunded',
  transferred: 'Transferred',
};

export function TicketStatusChart({ data }: TicketStatusChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: STATUS_LABELS[key as keyof typeof STATUS_LABELS] || key,
      value,
      color: COLORS[key as keyof typeof COLORS] || '#6b7280',
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No ticket data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(props: any) => {
            const { name, percent } = props;
            return `${name}: ${(percent * 100).toFixed(0)}%`;
          }}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
