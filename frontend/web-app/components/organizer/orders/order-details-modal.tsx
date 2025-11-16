'use client';

import { OrderDetail } from '@/lib/types/organizer';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { X, User, CreditCard, Ticket, Package } from 'lucide-react';

interface OrderDetailsModalProps {
  order: OrderDetail;
  onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    refunded: 'bg-red-100 text-red-800 border-red-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
    chargeback: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <div>
            <h2 className="text-xl font-bold">Order Details</h2>
            <p className="text-sm text-muted-foreground font-mono">{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Total */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1.5 rounded font-medium border ${statusColors[order.status]}`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(order.totalCents, order.currency)}</p>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Buyer Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{order.buyer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{order.buyer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-medium">{formatDateTime(order.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Order Items</h3>
            </div>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{item.ticketType.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.ticketType.kind} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.unitPriceCents * item.quantity, order.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tickets */}
          {order.tickets && order.tickets.length > 0 && (
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Tickets ({order.tickets.length})</h3>
              </div>
              <div className="space-y-2">
                {order.tickets.map((ticket) => (
                  <div key={ticket.id} className="flex justify-between items-center text-sm">
                    <span className="font-mono">{ticket.id}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      ticket.status === 'issued' ? 'bg-green-100 text-green-800' :
                      ticket.status === 'refunded' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {order.payments && order.payments.length > 0 && (
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Payments</h3>
              </div>
              <div className="space-y-2">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-mono">{payment.id}</p>
                      <p className="text-xs text-muted-foreground">{payment.status}</p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(payment.amountCents, payment.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refunds */}
          {order.refunds && order.refunds.length > 0 && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-3">Refunds</h3>
              <div className="space-y-2">
                {order.refunds.map((refund, index) => (
                  <div key={index} className="flex justify-between items-center text-sm text-red-900">
                    <div>
                      <p className="font-medium">Refund #{index + 1}</p>
                      {refund.reason && (
                        <p className="text-xs">{refund.reason}</p>
                      )}
                    </div>
                    <p className="font-semibold">
                      -{formatCurrency(refund.amountCents, order.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-secondary/30">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
