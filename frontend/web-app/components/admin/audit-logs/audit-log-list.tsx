'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text } from '@/components/ui';
import { adminApiService, type AdminActivityLog } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface AuditLogListProps {
  className?: string;
}

export function AuditLogList({ className }: AuditLogListProps) {
  const { accessToken } = useAuth();
  const [logs, setLogs] = React.useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [sorting, setSorting] = React.useState<{
    field: string;
    direction: 'asc' | 'desc';
  }>({
    field: 'createdAt',
    direction: 'desc',
  });

  // Load audit logs on mount and when filters/sorting change
  React.useEffect(() => {
    if (!accessToken) return;
    
    loadAuditLogs();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadAuditLogs = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getAuditLogs(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        action: filters.action as string,
        targetKind: filters.targetKind as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setLogs(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
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
      key: 'createdAt',
      title: 'Timestamp',
      sortable: true,
      render: (value: unknown, log: AdminActivityLog) => (
        <div className="flex flex-col gap-1">
          <Text className="text-sm">{new Date(log.createdAt).toLocaleDateString()}</Text>
          <Text className="text-xs text-muted-foreground">
            {new Date(log.createdAt).toLocaleTimeString()}
          </Text>
        </div>
      ),
    },
    {
      key: 'actorName',
      title: 'Actor',
      sortable: true,
      render: (value: unknown, log: AdminActivityLog) => (
        <Text className="font-medium">{log.actorName || 'System'}</Text>
      ),
    },
    {
      key: 'action',
      title: 'Action',
      sortable: true,
      render: (value: unknown, log: AdminActivityLog) => (
        <StatusBadge status={log.action} />
      ),
    },
    {
      key: 'targetKind',
      title: 'Target Type',
      sortable: true,
      render: (value: unknown, log: AdminActivityLog) => (
        <Text className="capitalize">{log.targetKind}</Text>
      ),
    },
    {
      key: 'targetId',
      title: 'Target ID',
      sortable: false,
      render: (value: unknown, log: AdminActivityLog) => (
        <Text className="font-mono text-xs">
          {log.targetId ? log.targetId.substring(0, 8) + '...' : 'N/A'}
        </Text>
      ),
    },
    {
      key: 'meta',
      title: 'Details',
      sortable: false,
      render: (value: unknown, log: AdminActivityLog) => (
        <div className="max-w-xs">
          {log.meta && Object.keys(log.meta).length > 0 ? (
            <details className="cursor-pointer">
              <summary className="text-xs text-primary hover:underline">
                View metadata
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(log.meta, null, 2)}
              </pre>
            </details>
          ) : (
            <Text className="text-xs text-muted-foreground">No metadata</Text>
          )}
        </div>
      ),
    },
  ];

  const filterFields = [
    {
      key: 'action',
      label: 'Action',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Actions' },
        { value: 'create', label: 'Create' },
        { value: 'update', label: 'Update' },
        { value: 'delete', label: 'Delete' },
        { value: 'login', label: 'Login' },
        { value: 'logout', label: 'Logout' },
        { value: 'approve', label: 'Approve' },
        { value: 'reject', label: 'Reject' },
        { value: 'suspend', label: 'Suspend' },
        { value: 'activate', label: 'Activate' },
      ],
    },
    {
      key: 'targetKind',
      label: 'Target Type',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Types' },
        { value: 'user', label: 'User' },
        { value: 'organization', label: 'Organization' },
        { value: 'event', label: 'Event' },
        { value: 'order', label: 'Order' },
        { value: 'payment', label: 'Payment' },
        { value: 'payout', label: 'Payout' },
        { value: 'ticket', label: 'Ticket' },
      ],
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">View all platform activity and changes</p>
        </div>
      </div>

      {/* Filters */}
      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {/* Audit Logs Table */}
      <DataTable
        data={logs}
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
      />
    </div>
  );
}

