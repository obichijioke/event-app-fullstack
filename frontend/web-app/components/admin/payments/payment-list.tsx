'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text } from '@/components/ui';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { adminApiService, type AdminPayment } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface PaymentListProps {
  className?: string;
}

export function PaymentList({ className }: PaymentListProps) {
  const { accessToken } = useAuth();
  const [payments, setPayments] = React.useState<AdminPayment[]>([]);
  const [loading, setLoading] = React.useState(false);
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

  // Load payments on mount and when filters/sorting change
  React.useEffect(() => {
    if (!accessToken) return;
    
    loadPayments();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadPayments = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getPayments(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        status: filters.status as string,
        provider: filters.provider as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setPayments(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
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

  const columns = [
    {
      key: 'id',
      title: 'Payment ID',
      sortable: true,
      render: (value: unknown, payment: AdminPayment) => (
        <Text className="font-mono text-xs">{payment.id.substring(0, 8)}...</Text>
      ),
    },
    {
      key: 'buyerName',
      title: 'Buyer',
      sortable: true,
      render: (value: unknown, payment: AdminPayment) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium">{payment.buyerName}</Text>
          <Text className="text-xs text-muted-foreground">{payment.buyerEmail}</Text>
        </div>
      ),
    },
    {
      key: 'eventTitle',
      title: 'Event',
      sortable: true,
      render: (value: unknown, payment: AdminPayment) => (
        <Text>{payment.eventTitle}</Text>
      ),
    },
    {
      key: 'amountCents',
      title: 'Amount',
      sortable: true,
      render: (value: unknown, payment: AdminPayment) => (
        <Text className="font-medium">
          <CurrencyDisplay
            amountCents={payment.amountCents}
            currency={payment.currency}
            showFree={false}
          />
        </Text>
      ),
    },
    {
      key: 'provider',
      title: 'Provider',
      sortable: true,
      render: (value: unknown, payment: AdminPayment) => (
        <Text className="capitalize">{payment.provider}</Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, payment: AdminPayment) => (
        <StatusBadge status={payment.status} />
      ),
    },
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      render: (value: unknown, payment: AdminPayment) => (
        <div className="flex flex-col gap-1">
          <Text>{new Date(payment.createdAt).toLocaleDateString()}</Text>
          <Text className="text-xs text-muted-foreground">
            {new Date(payment.createdAt).toLocaleTimeString()}
          </Text>
        </div>
      ),
    },
  ];

  const filterFields = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by buyer name or email...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Status' },
        { value: 'requires_action', label: 'Requires Action' },
        { value: 'authorized', label: 'Authorized' },
        { value: 'captured', label: 'Captured' },
        { value: 'voided', label: 'Voided' },
        { value: 'failed', label: 'Failed' },
      ],
    },
    {
      key: 'provider',
      label: 'Provider',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Providers' },
        { value: 'stripe', label: 'Stripe' },
        { value: 'paystack', label: 'Paystack' },
      ],
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (payment: AdminPayment) => {
        window.location.href = `/admin/payments/${payment.id}`;
      },
    },
    {
      label: 'View Order',
      onClick: (payment: AdminPayment) => {
        window.location.href = `/admin/orders/${payment.orderId}`;
      },
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Monitoring</h1>
          <p className="text-muted-foreground mt-1">Monitor all platform payments</p>
        </div>
      </div>

      {/* Filters */}
      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {/* Payments Table */}
      <DataTable
        data={payments}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: handlePageChange,
        }}
        sorting={{
          ...sorting,
          onSort: handleSort,
        }}
        actions={actions}
      />
    </div>
  );
}

