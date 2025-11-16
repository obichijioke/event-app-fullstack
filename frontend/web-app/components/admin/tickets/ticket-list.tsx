'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text } from '@/components/ui';
import { adminApiService, type AdminTicket } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface TicketListProps {
  className?: string;
}

export function TicketList({ className }: TicketListProps) {
  const { accessToken } = useAuth();
  const [tickets, setTickets] = React.useState<AdminTicket[]>([]);
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
    loadTickets();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadTickets = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getTickets(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        status: filters.status as string,
        eventId: filters.eventId as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setTickets(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
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

  const handleVoidTicket = async (ticket: AdminTicket) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to void ticket ${ticket.ticketCode}?`)) return;

    try {
      await adminApiService.voidTicket(ticket.id, accessToken);
      alert('Ticket voided successfully');
      loadTickets();
    } catch (error) {
      console.error('Failed to void ticket:', error);
      alert('Failed to void ticket');
    }
  };

  const formatCurrency = (cents: number, currency: string): string => {
    const amount = cents / 100;
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const columns = [
    {
      key: 'ticketCode',
      title: 'Ticket Code',
      sortable: true,
      render: (value: unknown, ticket: AdminTicket) => (
        <Text className="font-mono text-xs font-medium">{ticket.ticketCode}</Text>
      ),
    },
    {
      key: 'buyerName',
      title: 'Buyer',
      sortable: true,
      render: (value: unknown, ticket: AdminTicket) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium">{ticket.buyerName}</Text>
          <Text className="text-xs text-muted-foreground">{ticket.buyerEmail}</Text>
        </div>
      ),
    },
    {
      key: 'eventTitle',
      title: 'Event',
      sortable: true,
      render: (value: unknown, ticket: AdminTicket) => (
        <Text>{ticket.eventTitle}</Text>
      ),
    },
    {
      key: 'ticketTypeName',
      title: 'Type',
      sortable: true,
      render: (value: unknown, ticket: AdminTicket) => (
        <Text>{ticket.ticketTypeName}</Text>
      ),
    },
    {
      key: 'priceCents',
      title: 'Price',
      sortable: true,
      render: (value: unknown, ticket: AdminTicket) => (
        <Text className="font-medium">
          {formatCurrency(ticket.priceCents, ticket.currency)}
        </Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, ticket: AdminTicket) => (
        <StatusBadge status={ticket.status} />
      ),
    },
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      render: (value: unknown, ticket: AdminTicket) => (
        <div className="flex flex-col gap-1">
          <Text>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
          <Text className="text-xs text-muted-foreground">
            {new Date(ticket.createdAt).toLocaleTimeString()}
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
      placeholder: 'Search by buyer name, email, or ticket code...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Status' },
        { value: 'issued', label: 'Issued' },
        { value: 'transferred', label: 'Transferred' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'checked_in', label: 'Checked In' },
        { value: 'void', label: 'Void' },
      ],
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (ticket: AdminTicket) => {
        window.location.href = `/admin/tickets/${ticket.id}`;
      },
    },
    {
      label: 'Void',
      variant: 'destructive' as const,
      onClick: handleVoidTicket,
      condition: (ticket: AdminTicket) => ticket.status === 'issued',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ticket Management</h1>
          <p className="text-muted-foreground mt-1">Monitor all platform tickets, transfers, and check-ins</p>
        </div>
      </div>

      {/* Filters */}
      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {/* Tickets Table */}
      <DataTable
        data={tickets}
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
