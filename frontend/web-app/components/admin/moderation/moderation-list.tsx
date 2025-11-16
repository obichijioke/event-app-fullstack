'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text, Button } from '@/components/ui';
import { adminApiService, type AdminFlag } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface ModerationListProps {
  className?: string;
}

export function ModerationList({ className }: ModerationListProps) {
  const { accessToken } = useAuth();
  const [flags, setFlags] = React.useState<AdminFlag[]>([]);
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
    loadFlags();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadFlags = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getFlags(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        status: filters.status as string,
        targetKind: filters.targetKind as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setFlags(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFlag = async (flag: AdminFlag, action: 'approve' | 'reject' | 'resolve') => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to ${action} this flag?`)) return;

    try {
      await adminApiService.resolveFlag(flag.id, { action }, accessToken);
      alert(`Flag ${action}d successfully`);
      loadFlags();
    } catch (error) {
      console.error('Failed to resolve flag:', error);
      alert('Failed to resolve flag');
    }
  };

  const columns = [
    {
      key: 'targetKind',
      title: 'Type',
      sortable: true,
      render: (value: unknown, flag: AdminFlag) => (
        <span className="text-xs px-2 py-1 bg-secondary rounded capitalize">
          {flag.targetKind}
        </span>
      ),
    },
    {
      key: 'reason',
      title: 'Reason',
      sortable: true,
      render: (value: unknown, flag: AdminFlag) => (
        <Text className="font-medium">{flag.reason}</Text>
      ),
    },
    {
      key: 'reporterName',
      title: 'Reporter',
      sortable: true,
      render: (value: unknown, flag: AdminFlag) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium">{flag.reporterName}</Text>
          <Text className="text-xs text-muted-foreground">{flag.reporterEmail}</Text>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (value: unknown, flag: AdminFlag) => (
        <Text className="line-clamp-2">{flag.description || '—'}</Text>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, flag: AdminFlag) => (
        <StatusBadge status={flag.status} />
      ),
    },
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      render: (value: unknown, flag: AdminFlag) => (
        <Text>{new Date(flag.createdAt).toLocaleDateString()}</Text>
      ),
    },
  ];

  const filterFields = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by reason or reporter...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Status' },
        { value: 'open', label: 'Open' },
        { value: 'needs_changes', label: 'Needs Changes' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'resolved', label: 'Resolved' },
      ],
    },
    {
      key: 'targetKind',
      label: 'Type',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Types' },
        { value: 'event', label: 'Event' },
        { value: 'user', label: 'User' },
        { value: 'organization', label: 'Organization' },
        { value: 'review', label: 'Review' },
      ],
    },
  ];

  const actions = [
    {
      label: 'View Details',
      onClick: (flag: AdminFlag) => {
        window.location.href = `/admin/moderation/${flag.id}`;
      },
    },
    {
      label: 'Approve',
      variant: 'primary' as const,
      onClick: (flag: AdminFlag) => handleResolveFlag(flag, 'approve'),
      condition: (flag: AdminFlag) => flag.status === 'open',
    },
    {
      label: 'Reject',
      variant: 'destructive' as const,
      onClick: (flag: AdminFlag) => handleResolveFlag(flag, 'reject'),
      condition: (flag: AdminFlag) => flag.status === 'open',
    },
    {
      label: 'Resolve',
      variant: 'secondary' as const,
      onClick: (flag: AdminFlag) => handleResolveFlag(flag, 'resolve'),
      condition: (flag: AdminFlag) => flag.status !== 'resolved',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">Review and resolve flagged content</p>
        </div>
      </div>

      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setPagination(prev => ({ ...prev, page: 1 }));
        }}
        onReset={() => setFilters({})}
      />

      <DataTable
        data={flags}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
        }}
        sorting={{
          ...sorting,
          onSort: (field) => {
            setSorting(prev => ({
              field,
              direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
            }));
          },
        }}
        actions={actions}
      />
    </div>
  );
}
