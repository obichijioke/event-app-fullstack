'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text, Button } from '@/components/ui';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { adminApiService, type AdminOrder } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface OrderListProps {
  className?: string;
}

export function OrderList({ className }: OrderListProps) {
  const { accessToken } = useAuth();
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
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

  React.useEffect(() => {
    if (!accessToken) return;
    loadOrders();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadOrders = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getOrders(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        status: filters.status as string,
        eventId: filters.eventId as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setOrders(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
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

  const handleCancelOrder = async (order: AdminOrder) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) return;

    try {
      await adminApiService.cancelOrder(order.id, accessToken);
      alert('Order canceled successfully');
      loadOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order');
    }
  };

  const columns = [
    {
      key: 'orderNumber',
      title: 'Order #',
      sortable: true,
      render: (value: unknown, order: AdminOrder) => (
        <Text className="font-mono font-medium">{order.orderNumber}</Text>
      ),
    },
    {
      key: 'buyerName',
      title: 'Buyer',
      sortable: true,
      render: (value: unknown, order: AdminOrder) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium">{order.buyerName}</Text>
          <Text className="text-xs text-muted-foreground">{order.buyerEmail}</Text>
        </div>
      ),
    },
    {
      key: 'eventTitle',
      title: 'Event',
      sortable: true,
      render: (value: unknown, order: AdminOrder) => (
        <Text>{order.eventTitle}</Text>
      ),
    },
    {
      key: 'amountCents',
      title: 'Amount',
      sortable: true,
      render: (value: unknown, order: AdminOrder) => (
        <Text className="font-medium">
          <CurrencyDisplay
            amountCents={order.amountCents}
            currency={order.currency}
            showFree={false}
          />
        </Text>
      ),
    },
    {
      key: 'ticketCount',
      title: 'Tickets',
      sortable: true,
      render: (value: unknown, order: AdminOrder) => (
        <Text>{order.ticketCount}</Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, order: AdminOrder) => (
        <StatusBadge status={order.status} />
      ),
    },
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      render: (value: unknown, order: AdminOrder) => (
        <div className="flex flex-col gap-1">
          <Text>{new Date(order.createdAt).toLocaleDateString()}</Text>
          <Text className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString()}
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
      placeholder: 'Search by buyer name, email, or order number...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'canceled', label: 'Canceled' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'chargeback', label: 'Chargeback' },
      ],
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (order: AdminOrder) => {
        window.location.href = `/admin/orders/${order.id}`;
      },
    },
    {
      label: 'Cancel',
      variant: 'destructive' as const,
      onClick: handleCancelOrder,
      condition: (order: AdminOrder) => order.status === 'pending' || order.status === 'paid',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all platform orders</p>
        </div>
      </div>

      {/* Filters */}
      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {/* Orders Table */}
      <DataTable
        data={orders}
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
