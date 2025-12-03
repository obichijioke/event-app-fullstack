'use client';

import { useEffect, useState } from 'react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { OrderDetail, RefundDto, OrderListResponse, OrderStatus } from '@/lib/types/organizer';
import { OrderFilters } from './order-filters';
import { OrderRow } from './order-row';
import { OrderDetailsModal } from './order-details-modal';
import { RefundModal } from './refund-modal';
import { Loader2, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface EventOrdersContentProps {
  eventId: string;
}

export function EventOrdersContent({ eventId }: EventOrdersContentProps) {
  const { currentOrganization } = useOrganizerStore();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [refundingOrder, setRefundingOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    if (currentOrganization) {
      loadOrders();
    }
  }, [eventId, currentOrganization, pagination.page, search, status]);

  const loadOrders = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const response: OrderListResponse = await organizerApi.orders.list({
        orgId: currentOrganization.id,
        eventId,
        search: search || undefined,
        status: status || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setOrders(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (data: RefundDto) => {
    if (!currentOrganization || !refundingOrder) return;

    try {
      await organizerApi.orders.refund(refundingOrder.id, data, currentOrganization.id);
      toast.success('Refund processed successfully');
      setRefundingOrder(null);
      loadOrders();
    } catch (error: any) {
      console.error('Failed to process refund:', error);
      toast.error(error?.message || 'Refund may have been processed, but an error occurred. Refresh to confirm.');
      // Best-effort refresh in case the refund actually completed server-side
      await loadOrders();
      setRefundingOrder(null);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <OrderFilters
        search={search}
        status={status}
        onSearchChange={(value) => {
          setSearch(value);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        onStatusChange={(value) => {
          setStatus(value as OrderStatus | '');
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        onClear={handleClearFilters}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {orders.length} of {pagination.total} orders
        </p>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
          <p className="text-muted-foreground">
            {search || status
              ? 'Try adjusting your filters'
              : 'Orders will appear here once customers purchase tickets'}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Buyer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onViewDetails={setSelectedOrder}
                    onRefund={setRefundingOrder}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-border rounded-md hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-border rounded-md hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {refundingOrder && (
        <RefundModal
          order={refundingOrder}
          onSubmit={handleRefund}
          onCancel={() => setRefundingOrder(null)}
        />
      )}
    </div>
  );
}
