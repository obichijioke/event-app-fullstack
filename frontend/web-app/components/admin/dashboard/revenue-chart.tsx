'use client';

import * as React from 'react';
import { Text } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  period: string;
  className?: string;
}

export function RevenueChart({ data, period, className }: RevenueChartProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = React.useState<ChartDataPoint | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions
    const padding = 40;
    const width = rect.width - padding * 2;
    const height = rect.height - padding * 2;

    // Find min and max values
    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const maxOrders = Math.max(...data.map(d => d.orders));

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height + padding);
    ctx.lineTo(width + padding, height + padding);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width + padding, y);
      ctx.stroke();
    }

    // Draw revenue line
    if (data.length > 0) {
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = padding + (width / (data.length - 1)) * index;
        const y = height + padding - (point.revenue / maxRevenue) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw data points
      data.forEach((point, index) => {
        const x = padding + (width / (data.length - 1)) * index;
        const y = height + padding - (point.revenue / maxRevenue) * height;

        ctx.fillStyle = '#1e40af';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';

    // Y-axis labels (revenue)
    for (let i = 0; i <= 5; i++) {
      const value = (maxRevenue / 5) * (5 - i);
      const y = padding + (height / 5) * i;
      ctx.fillText(`₦${value.toLocaleString()}`, padding - 10, y + 4);
    }

    // X-axis labels (dates)
    ctx.textAlign = 'center';
    const step = Math.ceil(data.length / 6);
    data.forEach((point, index) => {
      if (index % step === 0 || index === data.length - 1) {
        const x = padding + (width / (data.length - 1)) * index;
        const date = new Date(point.date);
        const label = date.toLocaleDateString('en-NG', { 
          month: 'short', 
          day: 'numeric' 
        });
        ctx.fillText(label, x, height + padding + 20);
      }
    });

  }, [data]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 40;
    const width = rect.width - padding * 2;

    const index = Math.round(((x - padding) / width) * (data.length - 1));
    if (index >= 0 && index < data.length) {
      setHoveredPoint(data[index]);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const totalRevenue = data.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = data.reduce((sum, point) => sum + point.orders, 0);
  const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  return (
    <div className={cn('rounded-lg border border-border bg-card p-6', className)}>
      <div className="mb-4 flex items-center justify-between">
        <Text className="text-lg font-semibold text-foreground">Revenue Overview</Text>
        <Text className="text-sm text-muted-foreground">{period}</Text>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-md bg-muted p-4">
          <Text className="text-sm text-muted-foreground">Total Revenue</Text>
          <Text className="text-xl font-bold text-foreground">
            ₦{totalRevenue.toLocaleString()}
          </Text>
        </div>
        <div className="rounded-md bg-muted p-4">
          <Text className="text-sm text-muted-foreground">Total Orders</Text>
          <Text className="text-xl font-bold text-foreground">
            {totalOrders.toLocaleString()}
          </Text>
        </div>
        <div className="rounded-md bg-muted p-4">
          <Text className="text-sm text-muted-foreground">Average Revenue</Text>
          <Text className="text-xl font-bold text-foreground">
            ₦{avgRevenue.toLocaleString()}
          </Text>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* Tooltip */}
        {hoveredPoint && (
          <div className="absolute rounded-md border border-border bg-card p-3 shadow-lg">
            <Text className="text-sm font-medium text-foreground">
              {new Date(hoveredPoint.date).toLocaleDateString('en-NG', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <Text className="text-sm text-foreground">
                  Revenue: ₦{hoveredPoint.revenue.toLocaleString()}
                </Text>
              </div>
              <Text className="text-sm text-muted-foreground">
                Orders: {hoveredPoint.orders.toLocaleString()}
              </Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}