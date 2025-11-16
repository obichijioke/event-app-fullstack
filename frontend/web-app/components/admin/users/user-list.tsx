'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Button, Text } from '@/components/ui';
import { adminApiService, type AdminUser } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface UserListProps {
  className?: string;
}

export function UserList({ className }: UserListProps) {
  const { user, accessToken } = useAuth();
  const [users, setUsers] = React.useState<AdminUser[]>([]);
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

  // Load users on mount and when filters/sorting change
  React.useEffect(() => {
    if (!accessToken) return;
    
    loadUsers();
  }, [accessToken, filters, sorting]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApiService.getUsers(accessToken || '', {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        role: filters.role as string,
        status: filters.status as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setUsers(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
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

  const handleUserAction = async (action: 'suspend' | 'activate' | 'delete', user: AdminUser) => {
    if (!accessToken) return;

    try {
      switch (action) {
        case 'suspend':
          await adminApiService.suspendUser(accessToken, user.id);
          break;
        case 'activate':
          await adminApiService.activateUser(accessToken, user.id);
          break;
        case 'delete':
          await adminApiService.deleteUser(accessToken, user.id);
          break;
      }
      
      // Reload users to reflect changes
      await loadUsers();
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value: unknown, user: AdminUser) => (
        <div className="flex items-center gap-2">
          <Text className="font-medium">{user.name || user.email}</Text>
          {user.email && user.name && (
            <Text className="text-xs text-muted-foreground">({user.email})</Text>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value: unknown, user: AdminUser) => (
        <StatusBadge status={user.role} />
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, user: AdminUser) => (
        <StatusBadge status={user.status} />
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value: unknown, user: AdminUser) => (
        <Text>{new Date(user.createdAt).toLocaleDateString()}</Text>
      ),
    },
    {
      key: 'lastLoginAt',
      title: 'Last Login',
      sortable: true,
      render: (value: unknown, user: AdminUser) => (
        <Text>
          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
        </Text>
      ),
    },
  ];

  const filterFields = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by name or email...',
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Roles' },
        { value: 'attendee', label: 'Attendee' },
        { value: 'organizer', label: 'Organizer' },
        { value: 'moderator', label: 'Moderator' },
        { value: 'admin', label: 'Admin' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
      ],
    },
  ];

  const actions = [
    {
      label: 'View',
      onClick: (user: AdminUser) => {
        // Navigate to user details
        window.location.href = `/admin/users/${user.id}`;
      },
    },
    ...(user?.role === 'admin' ? [] : [
      {
        label: 'Suspend',
        onClick: (user: AdminUser) => handleUserAction('suspend', user),
        variant: 'warning' as const,
      },
      {
        label: 'Delete',
        onClick: (user: AdminUser) => handleUserAction('delete', user),
        variant: 'destructive' as const,
      },
    ]),
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Text className="text-lg font-semibold text-foreground">User Management</Text>
        <Button onClick={() => window.location.href = '/admin/users/create'}>
          Add User
        </Button>
      </div>

      {/* Filters */}
      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {/* Users Table */}
      <DataTable
        data={users}
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
