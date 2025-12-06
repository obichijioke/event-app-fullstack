'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Button, Text } from '@/components/ui';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { adminApiService, type AdminRefund, type AdminOrder } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface RefundListProps {
  className?: string;
}

export function RefundList({ className }: RefundListProps) {
  const { accessToken } = useAuth();
  const { formatAmount } = useCurrency();
  const [refunds, setRefunds] = React.useState<AdminRefund[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedRefund, setSelectedRefund] = React.useState<AdminRefund | null>(null);
  const [orderModal, setOrderModal] = React.useState<{
    open: boolean;
    loading: boolean;
    order: AdminOrder | null;
    refund: AdminRefund | null;
  }>({ open: false, loading: false, order: null, refund: null });
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [createData, setCreateData] = React.useState({
    orderId: '',
    amountCents: 0,
    currency: 'USD',
    reason: '',
  });
  const [actionLoading, setActionLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [sorting, setSorting] = React.useState({
    field: 'createdAt' as string,
    direction: 'desc' as 'asc' | 'desc',
  });

  // Load refunds on mount and when filters/sorting change
  React.useEffect(() => {
    if (!accessToken) return;

    loadRefunds();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadRefunds = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getRefunds(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        status: filters.status as string,
        dateFrom: filters.dateFrom as string,
        dateTo: filters.dateTo as string,
        amountMin: filters.amountMin as number,
        amountMax: filters.amountMax as number,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setRefunds(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: string) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleViewOrder = async (refund: AdminRefund) => {
    if (!accessToken) return;
    setOrderModal({ open: true, loading: true, order: null, refund });
    try {
      const resp = await adminApiService.getOrder(refund.orderId, accessToken);
      if (resp.success && resp.data) {
        setOrderModal({ open: true, loading: false, order: resp.data, refund });
      } else {
        throw new Error('Failed to load order');
      }
    } catch (err) {
      console.error('Failed to load order for refund', err);
      alert('Failed to load order details');
      setOrderModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleApprove = async (refund: AdminRefund) => {
    if (
      !accessToken ||
      !confirm(`Approve refund of ${formatAmount(refund.amountCents, refund.currency)}?`)
    )
      return;

    setActionLoading(true);
    try {
      await adminApiService.approveRefund(accessToken, refund.id);
      await loadRefunds(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to approve refund:', error);
      alert('Failed to approve refund');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (refund: AdminRefund) => {
    const reason = prompt('Enter rejection reason:');
    if (!accessToken || !reason) return;

    setActionLoading(true);
    try {
      await adminApiService.rejectRefund(accessToken, refund.id, reason);
      await loadRefunds(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to reject refund:', error);
      alert('Failed to reject refund');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcess = async (refund: AdminRefund) => {
    if (
      !accessToken ||
      !confirm(
        `Process refund of ${formatAmount(refund.amountCents, refund.currency)}? This will refund the payment provider.`,
      )
    )
      return;

    setActionLoading(true);
    try {
      await adminApiService.processRefund(accessToken, refund.id);
      await loadRefunds(); // Reload to get updated data
      toast.success('Refund processed successfully');
    } catch (error) {
      console.error('Failed to process refund:', error);
      const message =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        'Failed to process refund';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      title: 'Refund ID',
      sortable: true,
      render: (value: unknown, refund: AdminRefund) => (
        <Text className="font-mono text-xs">{refund.id.substring(0, 8)}...</Text>
      ),
    },
    {
      key: 'buyerName',
      title: 'Buyer',
      sortable: true,
      render: (value: unknown, refund: AdminRefund) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium">{refund.buyerName}</Text>
          <Text className="text-xs text-muted-foreground">{refund.buyerEmail}</Text>
        </div>
      ),
    },
    {
      key: 'eventTitle',
      title: 'Event',
      sortable: true,
      render: (value: unknown, refund: AdminRefund) => (
        <Text className="line-clamp-2">{refund.eventTitle}</Text>
      ),
    },
    {
      key: 'amountCents',
      title: 'Refund Amount',
      sortable: true,
      render: (value: unknown, refund: AdminRefund) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium">
            <CurrencyDisplay
              amountCents={refund.amountCents}
              currency={refund.currency}
              showFree={false}
            />
          </Text>
          <Text className="text-xs text-muted-foreground">
            of{' '}
            <CurrencyDisplay
              amountCents={refund.orderTotal}
              currency={refund.currency}
              showFree={false}
            />
          </Text>
        </div>
      ),
    },
    {
      key: 'reason',
      title: 'Reason',
      sortable: false,
      render: (value: unknown, refund: AdminRefund) => (
        <Text className="text-sm line-clamp-2">
          {refund.reason || '—'}
        </Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, refund: AdminRefund) => (
        <StatusBadge status={`refund_${refund.status}`} />
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value: unknown, refund: AdminRefund) => (
        <div className="flex flex-col gap-1">
          <Text>{new Date(refund.createdAt).toLocaleDateString()}</Text>
          <Text className="text-xs text-muted-foreground">
            {new Date(refund.createdAt).toLocaleTimeString()}
          </Text>
        </div>
      ),
    },
    {
      key: 'creatorName',
      title: 'Created By',
      sortable: false,
      render: (value: unknown, refund: AdminRefund) => (
        <Text className="text-sm">{refund.creatorName}</Text>
      ),
    },
  ];

  const filterFields = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by order ID or buyer...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'processed', label: 'Processed' },
        { value: 'failed', label: 'Failed' },
        { value: 'canceled', label: 'Canceled' },
      ],
    },
    {
      key: 'dateFrom',
      label: 'From',
      type: 'date' as const,
    },
    {
      key: 'dateTo',
      label: 'To',
      type: 'date' as const,
    },
    {
      key: 'amountMin',
      label: 'Min Amount (¢)',
      type: 'number' as const,
      placeholder: 'e.g. 1000',
    },
    {
      key: 'amountMax',
      label: 'Max Amount (¢)',
      type: 'number' as const,
      placeholder: 'e.g. 100000',
    },
  ];

  const getActions = (refund: AdminRefund): {
    label: string;
    onClick: (item: AdminRefund) => void | Promise<void>;
    variant?: 'primary' | 'secondary' | 'destructive' | 'success' | 'warning';
  }[] => {
    const actions: {
      label: string;
      onClick: (item: AdminRefund) => void | Promise<void>;
      variant?: 'primary' | 'secondary' | 'destructive' | 'success' | 'warning';
    }[] = [
      {
        label: 'View Details',
        onClick: (refund: AdminRefund) => setSelectedRefund(refund),
        variant: 'secondary',
      },
      {
        label: 'View Order',
        onClick: handleViewOrder,
      },
    ];

    // Add status-specific actions
    if (refund.status === 'pending') {
      actions.unshift(
        {
          label: 'Approve',
          onClick: handleApprove,
          variant: 'primary',
        },
        {
          label: 'Reject',
          onClick: handleReject,
          variant: 'destructive',
        }
      );
    }

    if (refund.status === 'approved') {
      actions.unshift({
        label: 'Process',
        onClick: handleProcess,
        variant: 'primary',
      });
    }

    return actions;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Refund Management</h1>
          <p className="text-muted-foreground mt-1">Oversee refund requests and processing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              if (!accessToken) return;
              try {
                const resp = await adminApiService.exportRefunds(accessToken, {
                  search: filters.search as string,
                  status: filters.status as string,
                  dateFrom: filters.dateFrom as string,
                  dateTo: filters.dateTo as string,
                  amountMin: filters.amountMin as number,
                  amountMax: filters.amountMax as number,
                });
                if (resp.success && resp.data) {
                  const blob = new Blob([resp.data], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `refunds-${new Date().toISOString()}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                }
              } catch (err) {
                console.error('Failed to export refunds', err);
                alert('Export failed');
              }
            }}
          >
            Export CSV
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create Refund
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {/* Refunds Table */}
      <DataTable
        data={refunds}
        columns={columns}
        loading={loading || actionLoading}
        pagination={{
          ...pagination,
          onPageChange: handlePageChange,
        }}
        sorting={{
          ...sorting,
          onSort: handleSort,
        }}
        actions={refunds.length > 0 ? getActions(refunds[0]) : []}
      />

      {/* Summary Stats */}
      {!loading && refunds.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <Text className="text-sm text-muted-foreground">Total Refunds</Text>
            <Text className="text-2xl font-bold mt-1">{pagination.total}</Text>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <Text className="text-sm text-muted-foreground">Pending</Text>
            <Text className="text-2xl font-bold mt-1 text-warning">
              {refunds.filter(r => r.status === 'pending').length}
            </Text>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <Text className="text-sm text-muted-foreground">Processed</Text>
            <Text className="text-2xl font-bold mt-1 text-success">
              {refunds.filter(r => r.status === 'processed').length}
            </Text>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <Text className="text-sm text-muted-foreground">Total Amount</Text>
            <Text className="text-2xl font-bold mt-1">
              <CurrencyDisplay
                amountCents={refunds.reduce((sum, r) => sum + Number(r.amountCents || 0), 0)}
                currency={refunds[0]?.currency || 'USD'}
                showFree={false}
              />
            </Text>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Refund Details</h2>
              <Button variant="secondary" size="sm" onClick={() => setSelectedRefund(null)}>
                Close
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Refund ID</p>
                <p className="font-mono">{selectedRefund.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Order ID</p>
                <p className="font-mono">{selectedRefund.orderId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <CurrencyDisplay amountCents={selectedRefund.amountCents} currency={selectedRefund.currency} />
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <StatusBadge status={`refund_${selectedRefund.status}`} />
              </div>
              <div>
                <p className="text-muted-foreground">Buyer</p>
                <p>{selectedRefund.buyerName}</p>
                <p className="text-muted-foreground">{selectedRefund.buyerEmail}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Event</p>
                <p>{selectedRefund.eventTitle}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Reason</p>
                <p>{selectedRefund.reason || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created At</p>
                <p>{new Date(selectedRefund.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Processed At</p>
                <p>{selectedRefund.processedAt ? new Date(selectedRefund.processedAt).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Provider Ref</p>
                <p className="font-mono">{selectedRefund.providerRef || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p>{selectedRefund.creatorName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order View Modal */}
      {orderModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Order Details</h2>
                {orderModal.refund && (
                  <p className="text-sm text-muted-foreground">
                    Refund #{orderModal.refund.id.substring(0, 8)} • Order #{orderModal.refund.orderId.substring(0, 8)}
                  </p>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setOrderModal({ open: false, loading: false, order: null, refund: null })}>
                Close
              </Button>
            </div>

            {orderModal.loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading order...
              </div>
            )}

            {!orderModal.loading && orderModal.order && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Order ID</p>
                    <p className="font-mono">{orderModal.order.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Status</p>
                    <StatusBadge status={`order_${orderModal.order.status}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Buyer</p>
                    <p className="font-medium">{orderModal.order.buyerName}</p>
                    <p className="text-muted-foreground">{orderModal.order.buyerEmail}</p>
                  </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Event</p>
                  <p>{orderModal.order.eventTitle}</p>
                  {orderModal.order.eventStartAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(orderModal.order.eventStartAt).toLocaleString()}{' '}
                      {new Date(orderModal.order.eventStartAt) < new Date() ? '(Ended)' : '(Upcoming)'}
                    </p>
                  )}
                </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Amount</p>
                    <CurrencyDisplay
                      amountCents={
                        orderModal.order.amountCents ??
                        orderModal.order.totalCents ??
                        orderModal.refund?.amountCents ??
                        0
                      }
                      currency={orderModal.order.currency}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Tickets</p>
                    <p>{orderModal.order.tickets?.length ?? orderModal.order.ticketCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Created</p>
                    <p>{new Date(orderModal.order.createdAt).toLocaleString()}</p>
                  </div>
                  {orderModal.order.paidAt && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Paid At</p>
                      <p>{new Date(orderModal.order.paidAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Ticket list */}
                {orderModal.order.tickets && orderModal.order.tickets.length > 0 && (
                  <div className="border border-border rounded-lg p-3">
                    <p className="text-sm font-semibold mb-2">Tickets</p>
                    <div className="space-y-1 text-sm">
                      {orderModal.order.tickets.map((t) => (
                        <div key={t.id} className="flex items-center justify-between">
                          <span className="font-mono text-xs">{t.id.substring(0, 8)}</span>
                          <span className="capitalize text-muted-foreground">{t.status.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payments */}
                {orderModal.order.payments && orderModal.order.payments.length > 0 && (
                  <div className="border border-border rounded-lg p-3">
                    <p className="text-sm font-semibold mb-2">Payments</p>
                    <div className="space-y-1 text-sm">
                      {orderModal.order.payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between">
                          <span className="font-mono text-xs">{p.provider}</span>
                          <span className="text-muted-foreground">
                            {p.status} •{' '}
                            <CurrencyDisplay amountCents={p.amountCents} currency={p.currency} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!orderModal.loading && !orderModal.order && (
              <p className="text-sm text-destructive">Failed to load order details.</p>
            )}
          </div>
        </div>
      )}

      {/* Create Refund Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Refund</h2>
              <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                Close
              </Button>
            </div>
            <label className="block text-sm">
              Order ID
              <input
                className="mt-1 w-full border border-border rounded-md px-3 py-2"
                value={createData.orderId}
                onChange={(e) => setCreateData((prev) => ({ ...prev, orderId: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              Amount (cents)
              <input
                type="number"
                className="mt-1 w-full border border-border rounded-md px-3 py-2"
                value={createData.amountCents}
                onChange={(e) =>
                  setCreateData((prev) => ({ ...prev, amountCents: Number(e.target.value || 0) }))
                }
              />
            </label>
            <label className="block text-sm">
              Currency
              <input
                className="mt-1 w-full border border-border rounded-md px-3 py-2 uppercase"
                value={createData.currency}
                onChange={(e) => setCreateData((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
              />
            </label>
            <label className="block text-sm">
              Reason
              <textarea
                className="mt-1 w-full border border-border rounded-md px-3 py-2"
                value={createData.reason}
                onChange={(e) => setCreateData((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!accessToken) return;
                  setActionLoading(true);
                  try {
                    await adminApiService.createRefund(accessToken, createData);
                    setShowCreateModal(false);
                    setCreateData({ orderId: '', amountCents: 0, currency: 'USD', reason: '' });
                    await loadRefunds();
                  } catch (err) {
                    console.error('Failed to create refund', err);
                    alert('Failed to create refund');
                  } finally {
                    setActionLoading(false);
                  }
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
