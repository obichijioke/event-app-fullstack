'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { ordersApi } from '@/lib/api/orders-api';

type OrderStatus = 'pending' | 'paid' | 'canceled' | 'refunded' | 'chargeback';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const statusLabel: Record<OrderStatus, string> = useMemo(
    () => ({
      pending: 'Pending',
      paid: 'Completed',
      canceled: 'Cancelled',
      refunded: 'Refunded',
      chargeback: 'Chargeback',
    }),
    [],
  );

  const statusClass: Record<OrderStatus, string> = useMemo(
    () => ({
      pending: 'bg-warning/10 text-warning',
      paid: 'bg-success/10 text-success',
      canceled: 'bg-error/10 text-error',
      refunded: 'bg-secondary/10 text-secondary-foreground',
      chargeback: 'bg-error/10 text-error',
    }),
    [],
  );

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getMyOrders({
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: pageSize,
      });
      setOrders(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, startDate, endDate, page]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Order History</h1>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-card p-4 shadow-card">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            className="rounded-md border border-border bg-background px-4 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">All Orders</option>
            <option value="paid">Completed</option>
            <option value="pending">Pending</option>
            <option value="canceled">Cancelled</option>
            <option value="refunded">Refunded</option>
            <option value="chargeback">Chargeback</option>
          </select>
          <input
            type="date"
            className="rounded-md border border-border bg-background px-4 py-2 text-sm"
            value={startDate}
            onChange={(e) => {
              setPage(1);
              setStartDate(e.target.value);
            }}
          />
          <input
            type="date"
            className="rounded-md border border-border bg-background px-4 py-2 text-sm"
            value={endDate}
            onChange={(e) => {
              setPage(1);
              setEndDate(e.target.value);
            }}
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading && <p className="text-muted-foreground text-sm">Loading orders...</p>}
        {error && <p className="text-error text-sm">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No orders found</p>
        )}

        {!loading &&
          !error &&
          orders.map((order) => {
            const status: OrderStatus = order.status || 'pending';
            return (
              <div key={order.id} className="rounded-lg bg-card p-6 shadow-card">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{order.event?.title || 'Event'}</h3>
                    <p className="text-sm text-muted-foreground">
                      Order #{order.id} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${statusClass[status] || 'bg-muted text-foreground'}`}
                  >
                    {statusLabel[status] || status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    <CurrencyDisplay amountCents={Number(order.totalCents || 0)} currency={order.currency} />
                  </p>
                  <Link href={`/orders/${order.id}`} className="text-sm text-primary hover:underline">
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
      </div>

      {/* Pagination */}
      {!loading && !error && total > pageSize && (
        <div className="mt-6 flex items-center justify-between">
          <button
            className="px-3 py-2 rounded-md border border-border text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          <button
            className="px-3 py-2 rounded-md border border-border text-sm disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * pageSize >= total}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
