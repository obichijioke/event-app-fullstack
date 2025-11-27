'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { ordersApi } from '@/lib/api/orders-api';
import { ShoppingBag, Calendar, CreditCard, Ticket, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
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
      pending: 'bg-amber-100 text-amber-800',
      paid: 'bg-emerald-100 text-emerald-800',
      canceled: 'bg-slate-200 text-slate-700',
      refunded: 'bg-blue-100 text-blue-800',
      chargeback: 'bg-red-100 text-red-800',
    }),
    [],
  );

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

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
    <div className="bg-muted/40 py-10">
      <div className="container mx-auto px-4">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-border/60 bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-8 text-white md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                <ShoppingBag className="h-4 w-4" />
                My Orders
              </div>
              <h1 className="text-3xl font-semibold">Order History</h1>
              <p className="text-sm text-slate-200">View and manage your event ticket orders</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrders}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Filters */}
            <div className="mb-6 rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
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
                  placeholder="Start Date"
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  value={startDate}
                  onChange={(e) => {
                    setPage(1);
                    setStartDate(e.target.value);
                  }}
                />
                <input
                  type="date"
                  placeholder="End Date"
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  value={endDate}
                  onChange={(e) => {
                    setPage(1);
                    setEndDate(e.target.value);
                  }}
                />
                {(statusFilter || startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStatusFilter('');
                      setStartDate('');
                      setEndDate('');
                      setPage(1);
                    }}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Orders List */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading orders...</span>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!loading && !error && orders.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/40 px-6 py-12 text-center text-muted-foreground">
                <ShoppingBag className="h-8 w-8" />
                <div className="text-sm">
                  No orders found. Browse events to book your next experience.
                </div>
                <Link
                  href="/events"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Browse events
                </Link>
              </div>
            )}

            {!loading && !error && orders.length > 0 && (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status: OrderStatus = order.status || 'pending';
                  const isExpanded = expandedOrders.has(order.id);
                  const ticketCount = order.tickets?.length || 0;

                  return (
                    <div key={order.id} className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
                      {/* Order Header */}
                      <button
                        onClick={() => toggleOrder(order.id)}
                        className="w-full bg-linear-to-r from-slate-50 to-slate-100 px-4 py-4 text-left transition hover:from-slate-100 hover:to-slate-200 dark:from-slate-800/50 dark:to-slate-900/50 dark:hover:from-slate-800 dark:hover:to-slate-900"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-semibold text-foreground">
                                {order.event?.title || 'Event'}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusClass[status] || 'bg-muted text-foreground'}`}
                              >
                                <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                                {statusLabel[status] || status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5" />
                                Order #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1.5">
                                <Ticket className="h-3.5 w-3.5" />
                                {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold text-foreground">
                                <CurrencyDisplay amountCents={Number(order.totalCents || 0)} currency={order.currency} />
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Order Details */}
                      {isExpanded && (
                        <div className="border-t border-border/50 bg-card p-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {/* Order Info */}
                            <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Order Information
                              </h4>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Order ID</span>
                                  <span className="font-mono font-semibold">{order.id.slice(0, 12).toUpperCase()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Date</span>
                                  <span className="font-medium">
                                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Payment Method</span>
                                  <span className="font-medium">{order.paymentProvider || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Price Breakdown
                              </h4>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Subtotal</span>
                                  <span className="font-medium">
                                    <CurrencyDisplay
                                      amountCents={Number(order.subtotalCents || 0)}
                                      currency={order.currency}
                                    />
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Fees</span>
                                  <span className="font-medium">
                                    <CurrencyDisplay
                                      amountCents={Number(order.feesCents || 0)}
                                      currency={order.currency}
                                    />
                                  </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-border/50 pt-1.5">
                                  <span className="font-semibold text-foreground">Total</span>
                                  <span className="text-base font-bold text-primary">
                                    <CurrencyDisplay
                                      amountCents={Number(order.totalCents || 0)}
                                      currency={order.currency}
                                    />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-4 flex justify-end">
                            <Link
                              href={`/orders/${order.id}`}
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                            >
                              View Full Details
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && total > pageSize && (
              <div className="mt-6 flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-muted-foreground">
                  Page {page} of {Math.ceil(total / pageSize)}
                </span>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= total}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
