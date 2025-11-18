'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Button, Text } from '@/components/ui';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { adminApiService, type AdminRefund } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface RefundListProps {
  className?: string;
}

export function RefundList({ className }: RefundListProps) {
  const { accessToken } = useAuth();
  const { formatAmount } = useCurrency();
  const [refunds, setRefunds] = React.useState<AdminRefund[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedRefund, setSelectedRefund] = React.useState<AdminRefund | null>(null);
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
      alert('Refund processed successfully');
    } catch (error) {
      console.error('Failed to process refund:', error);
      alert('Failed to process refund');
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
        label: 'View Order',
        onClick: (refund: AdminRefund) => {
          window.location.href = `/admin/orders/${refund.orderId}`;
        },
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
                amountCents={refunds.reduce((sum, r) => sum + r.amountCents, 0)}
                currency={refunds[0]?.currency || 'NGN'}
                showFree={false}
              />
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
