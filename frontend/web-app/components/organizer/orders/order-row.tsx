'use client';

import { OrderDetail } from '@/lib/types/organizer';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { Eye, RefreshCw } from 'lucide-react';

interface OrderRowProps {
  order: OrderDetail;
  onViewDetails: (order: OrderDetail) => void;
  onRefund: (order: OrderDetail) => void;
}

export function OrderRow({ order, onViewDetails, onRefund }: OrderRowProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    refunded: 'bg-red-100 text-red-800 border-red-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
    chargeback: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const canRefund = order.status === 'paid';

  return (
    <tr className="border-b border-border hover:bg-secondary/50 transition">
      <td className="px-4 py-3">
        <span className="font-mono text-sm">{order.id}</span>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{order.buyer.name}</p>
          <p className="text-sm text-muted-foreground">{order.buyer.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[order.status]}`}>
          {order.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-4 py-3 font-medium">
        {formatCurrency(order.totalCents, order.currency)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDateTime(order.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(order)}
            className="p-2 hover:bg-secondary rounded-md transition"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canRefund && (
            <button
              onClick={() => onRefund(order)}
              className="p-2 hover:bg-red-50 text-red-600 rounded-md transition"
              title="Refund order"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
