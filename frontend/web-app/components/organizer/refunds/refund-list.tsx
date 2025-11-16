'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Filter, Search, Calendar, AlertCircle } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { useAuth } from '@/components/auth';
import toast from 'react-hot-toast';
import type { OrderDetail, RefundStatus } from '@/lib/types/organizer';
import Link from 'next/link';

interface RefundItem {
  id: string;
  orderId: string;
  orderNumber: string;
  eventTitle: string;
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  amountCents: number;
  currency: string;
  reason?: string;
  status: RefundStatus;
  createdAt: string;
  processedAt?: string;
}

export function RefundList() {
  const { currentOrganization } = useOrganizerStore();
  const { initialized: authInitialized, accessToken } = useAuth();
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RefundStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authInitialized && accessToken && currentOrganization) {
      loadRefunds();
    }
  }, [authInitialized, accessToken, currentOrganization]);

  const loadRefunds = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      // Fetch all orders with refunded status or orders that have refunds
      const orders = await organizerApi.orders.list({
        orgId: currentOrganization.id,
        status: 'refunded',
        limit: 100,
      });

      // Extract refunds from orders
      const refundItems: RefundItem[] = [];

      for (const order of orders.data) {
        // Fetch full order details to get refunds
        try {
          const orderDetail: OrderDetail = await organizerApi.orders.get(
            order.id,
            currentOrganization.id
          );

          if (orderDetail.refunds && orderDetail.refunds.length > 0) {
            orderDetail.refunds.forEach((refund) => {
              refundItems.push({
                id: refund.id,
                orderId: order.id,
                orderNumber: `#${order.id.substring(0, 8).toUpperCase()}`,
                eventTitle: (order as any).event?.title || 'Unknown Event',
                eventId: (order as any).eventId || (order as any).event?.id || '',
                buyerName: order.buyer?.name || order.buyer?.email || 'Unknown',
                buyerEmail: order.buyer?.email || '',
                amountCents: Number(refund.amountCents),
                currency: refund.currency,
                reason: refund.reason,
                status: refund.status as RefundStatus,
                createdAt: refund.createdAt,
                processedAt: refund.processedAt,
              });
            });
          }
        } catch (error) {
          console.error(`Failed to load order ${order.id}:`, error);
        }
      }

      setRefunds(refundItems);
    } catch (error: any) {
      console.error('Failed to load refunds:', error);
      toast.error(error?.message || 'Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: RefundStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'canceled':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredRefunds = refunds.filter((refund) => {
    if (statusFilter !== 'all' && refund.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        refund.orderNumber.toLowerCase().includes(query) ||
        refund.buyerName.toLowerCase().includes(query) ||
        refund.buyerEmail.toLowerCase().includes(query) ||
        refund.eventTitle.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: refunds.length,
    totalAmount: refunds.reduce((sum, r) => sum + r.amountCents, 0),
    pending: refunds.filter((r) => r.status === 'pending').length,
    processed: refunds.filter((r) => r.status === 'processed').length,
    failed: refunds.filter((r) => r.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-lg shadow-card border border-border p-6 animate-pulse">
              <div className="h-4 bg-secondary rounded w-1/2 mb-2" />
              <div className="h-8 bg-secondary rounded w-3/4" />
            </div>
          ))}
        </div>

        {/* List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg shadow-card border border-border p-6 animate-pulse">
              <div className="h-6 bg-secondary rounded w-2/3 mb-4" />
              <div className="h-4 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Refunds</h2>
          <p className="text-muted-foreground mt-1">Track and manage refunded orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Refunds</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <DollarSign className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold mt-1">
                {refunds.length > 0 ? formatCurrency(stats.totalAmount, refunds[0].currency) : '$0.00'}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">{stats.pending}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Processed</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.processed}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-card border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by order, buyer, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RefundStatus | 'all')}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredRefunds.length === 0 && !loading && (
        <div className="bg-card rounded-lg shadow-card p-12 text-center">
          <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {refunds.length === 0 ? 'No Refunds Yet' : 'No Matching Refunds'}
          </h3>
          <p className="text-muted-foreground">
            {refunds.length === 0
              ? 'Refunded orders will appear here'
              : 'Try adjusting your filters or search query'}
          </p>
        </div>
      )}

      {/* Refunds List */}
      {filteredRefunds.length > 0 && (
        <div className="space-y-4">
          {filteredRefunds.map((refund) => (
            <div
              key={refund.id}
              className="bg-card rounded-lg shadow-card border border-border p-6 hover:border-primary/50 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  {/* Order and Event Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/organizer/events/${refund.eventId}/orders`}
                      className="text-lg font-semibold hover:text-primary transition"
                    >
                      {refund.orderNumber}
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <Link
                      href={`/organizer/events/${refund.eventId}`}
                      className="text-muted-foreground hover:text-primary transition"
                    >
                      {refund.eventTitle}
                    </Link>
                  </div>

                  {/* Buyer Info */}
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Buyer:</span> {refund.buyerName}
                    {refund.buyerEmail && ` (${refund.buyerEmail})`}
                  </p>

                  {/* Reason */}
                  {refund.reason && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium">Reason:</span> {refund.reason}
                    </p>
                  )}

                  {/* Dates */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Requested: {formatDate(refund.createdAt)}</span>
                    </div>
                    {refund.processedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Processed: {formatDate(refund.processedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="flex md:flex-col items-end gap-4 md:gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatCurrency(refund.amountCents, refund.currency)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(refund.status)}`}>
                    {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">About Refunds</p>
          <p>
            Refunds are processed through individual order pages. This dashboard provides a centralized view of all refunded orders across your organization.
            To issue a new refund, navigate to the specific order and select the refund option.
          </p>
        </div>
      </div>
    </div>
  );
}
