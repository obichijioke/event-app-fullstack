'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text } from '@/components/ui';
import { adminApiService, type AdminPayout } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface PayoutListProps {
  className?: string;
}

export function PayoutList({ className }: PayoutListProps) {
  const { accessToken } = useAuth();
  const [payouts, setPayouts] = React.useState<AdminPayout[]>([]);
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

  // Load payouts on mount and when filters/sorting change
  React.useEffect(() => {
    if (!accessToken) return;
    
    loadPayouts();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadPayouts = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getPayouts(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        status: filters.status as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setPayouts(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load payouts:', error);
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

  const handleApprovePayout = async (payoutId: string) => {
    if (!accessToken) return;

    try {
      await adminApiService.approvePayout(accessToken, payoutId);
      
      // Reload payouts to reflect changes
      await loadPayouts();
    } catch (error) {
      console.error('Failed to approve payout:', error);
    }
  };

  const formatCurrency = (cents: number, currency: string): string => {
    const amount = cents / 100;
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const columns = [
    {
      key: 'id',
      title: 'Payout ID',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <Text className="font-mono text-xs">{payout.id.substring(0, 8)}...</Text>
      ),
    },
    {
      key: 'orgName',
      title: 'Organization',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <Text className="font-medium">{payout.orgName}</Text>
      ),
    },
    {
      key: 'amountCents',
      title: 'Amount',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <Text className="font-medium">
          {formatCurrency(payout.amountCents, payout.currency)}
        </Text>
      ),
    },
    {
      key: 'provider',
      title: 'Provider',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <Text className="capitalize">{payout.provider || 'N/A'}</Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <StatusBadge status={payout.status} />
      ),
    },
    {
      key: 'scheduledFor',
      title: 'Scheduled',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <Text>
          {payout.scheduledFor ? new Date(payout.scheduledFor).toLocaleDateString() : 'N/A'}
        </Text>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value: unknown, payout: AdminPayout) => (
        <div className="flex flex-col gap-1">
          <Text>{new Date(payout.createdAt).toLocaleDateString()}</Text>
          <Text className="text-xs text-muted-foreground">
            {new Date(payout.createdAt).toLocaleTimeString()}
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
      placeholder: 'Search by organization...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'in_review', label: 'In Review' },
        { value: 'paid', label: 'Paid' },
        { value: 'failed', label: 'Failed' },
      ],
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (payout: AdminPayout) => {
        window.location.href = `/admin/payouts/${payout.id}`;
      },
    },
    {
      label: 'Approve',
      onClick: (payout: AdminPayout) => handleApprovePayout(payout.id),
      variant: 'success' as const,
      condition: (payout: AdminPayout) => payout.status === 'pending' || payout.status === 'in_review',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payout Management</h1>
          <p className="text-muted-foreground mt-1">Manage platform payouts to organizers</p>
        </div>
      </div>

      {/* Filters */}
      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {/* Payouts Table */}
      <DataTable
        data={payouts}
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

