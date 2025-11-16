import Link from 'next/link';
import { DashboardOrder } from '@/lib/types/organizer';
import { formatCurrency } from '@/lib/utils';

interface OrderItemProps {
  order: DashboardOrder;
}

export function OrderItem({ order }: OrderItemProps) {
  const statusColors = {
    paid: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    refunded: 'bg-gray-100 text-gray-800 border-gray-200',
    canceled: 'bg-red-100 text-red-800 border-red-200',
    chargeback: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <Link
      href={`/organizer/orders/${order.id}`}
      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <p className="font-medium text-foreground truncate">{order.buyer.name}</p>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded border ${
              statusColors[order.status]
            }`}
          >
            {order.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{order.event.title}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right ml-4">
        <p className="font-semibold text-foreground">
          {formatCurrency(order.totalCents, order.currency)}
        </p>
      </div>
    </Link>
  );
}
