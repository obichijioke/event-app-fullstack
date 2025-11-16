'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Text } from '@/components/ui';
import { adminApiService, type AdminSession } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface SessionListProps {
  className?: string;
}

export function SessionList({ className }: SessionListProps) {
  const { accessToken } = useAuth();
  const [sessions, setSessions] = React.useState<AdminSession[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [sorting, setSorting] = React.useState({
    field: 'lastActiveAt' as string,
    direction: 'desc' as 'asc' | 'desc',
  });

  React.useEffect(() => {
    if (!accessToken) return;
    loadSessions();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadSessions = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getSessions(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        active: filters.active as boolean | undefined,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setSessions(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (session: AdminSession) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to revoke this session?')) return;

    try {
      await adminApiService.revokeSession(session.id, accessToken);
      alert('Session revoked successfully');
      loadSessions();
    } catch (error) {
      console.error('Failed to revoke session:', error);
      alert('Failed to revoke session');
    }
  };

  const handleRevokeAllUserSessions = async (session: AdminSession) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to revoke all sessions for ${session.userName}?`)) return;

    try {
      await adminApiService.revokeAllUserSessions(session.userId, accessToken);
      alert('All user sessions revoked successfully');
      loadSessions();
    } catch (error) {
      console.error('Failed to revoke all user sessions:', error);
      alert('Failed to revoke sessions');
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const columns = [
    {
      key: 'userName',
      title: 'User',
      sortable: true,
      render: (value: unknown, session: AdminSession) => (
        <div className="flex flex-col gap-1">
          <Text className="font-medium">{session.userName}</Text>
          <Text className="text-xs text-muted-foreground">{session.userEmail}</Text>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      title: 'IP Address',
      render: (value: unknown, session: AdminSession) => (
        <Text className="font-mono text-xs">{session.ipAddress || '—'}</Text>
      ),
    },
    {
      key: 'userAgent',
      title: 'Device',
      render: (value: unknown, session: AdminSession) => (
        <Text className="line-clamp-1 text-xs">{session.userAgent || '—'}</Text>
      ),
    },
    {
      key: 'lastActiveAt',
      title: 'Last Active',
      sortable: true,
      render: (value: unknown, session: AdminSession) => (
        <div className="flex flex-col gap-1">
          <Text>{new Date(session.lastActiveAt).toLocaleDateString()}</Text>
          <Text className="text-xs text-muted-foreground">
            {new Date(session.lastActiveAt).toLocaleTimeString()}
          </Text>
        </div>
      ),
    },
    {
      key: 'expiresAt',
      title: 'Status',
      sortable: true,
      render: (value: unknown, session: AdminSession) => (
        <StatusBadge status={isExpired(session.expiresAt) ? 'expired' : 'active'} />
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value: unknown, session: AdminSession) => (
        <Text>{new Date(session.createdAt).toLocaleDateString()}</Text>
      ),
    },
  ];

  const filterFields = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by user name or email...',
    },
    {
      key: 'active',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Sessions' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Expired' },
      ],
    },
  ];

  const actions = [
    {
      label: 'Revoke',
      variant: 'destructive' as const,
      onClick: handleRevokeSession,
      condition: (session: AdminSession) => !isExpired(session.expiresAt),
    },
    {
      label: 'Revoke All User Sessions',
      variant: 'destructive' as const,
      onClick: handleRevokeAllUserSessions,
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Session Monitoring</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage active user sessions</p>
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
        data={sessions}
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
