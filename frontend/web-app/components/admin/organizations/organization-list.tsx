'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Button, Text } from '@/components/ui';
import { adminApiService, type AdminOrganization } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';

interface OrganizationListProps {
  className?: string;
}

export function OrganizationList({ className }: OrganizationListProps) {
  const { user, accessToken } = useAuth();
  const [organizations, setOrganizations] = React.useState<AdminOrganization[]>([]);
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

  // Load organizations on mount and when filters/sorting change
  React.useEffect(() => {
    if (!accessToken) return;

    loadOrganizations();
  }, [accessToken, filters, sorting, pagination.page]);

  const loadOrganizations = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await adminApiService.getOrganizations(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        status: filters.status as string,
        sortBy: sorting.field as string,
        sortOrder: sorting.direction,
      });

      if (response.success && response.data) {
        setOrganizations(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
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

  const handleOrganizationAction = async (action: 'view' | 'suspend' | 'delete', organization: AdminOrganization) => {
    if (!accessToken) return;

    try {
      switch (action) {
        case 'view':
          // Navigate to organization details
          window.location.href = `/admin/organizations/${organization.id}`;
          break;
        case 'suspend':
          await adminApiService.updateOrganization(accessToken, organization.id, { status: 'suspended' });
          break;
        case 'delete':
          await adminApiService.updateOrganization(accessToken, organization.id, { status: 'deleted' });
          break;
      }
      
      // Reload organizations to reflect changes
      await loadOrganizations();
    } catch (error) {
      console.error(`Failed to ${action} organization:`, error);
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value: unknown, organization: AdminOrganization) => (
        <div className="flex items-center gap-2">
          <Text className="font-medium">{organization.name}</Text>
          {organization.legalName && (
            <Text className="text-xs text-muted-foreground">({organization.legalName})</Text>
          )}
        </div>
      ),
    },
    {
      key: 'owner',
      title: 'Owner',
      sortable: true,
      render: (value: unknown, organization: AdminOrganization) => (
        <div className="flex items-center gap-2">
          <Text className="font-medium">{organization.ownerId || 'N/A'}</Text>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value: unknown, organization: AdminOrganization) => (
        <StatusBadge status={organization.status} />
      ),
    },
    {
      key: 'memberCount',
      title: 'Members',
      sortable: true,
      render: (value: unknown, organization: AdminOrganization) => (
        <Text>{organization.memberCount?.toLocaleString() || '0'}</Text>
      ),
    },
    {
      key: 'eventCount',
      title: 'Events',
      sortable: true,
      render: (value: unknown, organization: AdminOrganization) => (
        <Text>{organization.eventCount?.toLocaleString() || '0'}</Text>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      render: (value: unknown, organization: AdminOrganization) => (
        <Text>{new Date(organization.createdAt).toLocaleDateString()}</Text>
      ),
    },
  ];

  const filterFields = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by name or legal name...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
      ],
    },
  ];

  const actions = [
    {
      label: 'View',
      onClick: (organization: AdminOrganization) => {
        // Navigate to organization details
        window.location.href = `/admin/organizations/${organization.id}`;
      },
    },
    {
      label: 'Edit',
      onClick: (organization: AdminOrganization) => {
        // Navigate to organization edit
        window.location.href = `/admin/organizations/${organization.id}/edit`;
      },
    },
    {
      label: 'Suspend',
      onClick: (organization: AdminOrganization) => {
        // Suspend organization
        handleOrganizationAction('suspend', organization);
      },
      variant: 'warning' as const,
    },
    {
      label: 'Delete',
      onClick: (organization: AdminOrganization) => {
        // Delete organization
        handleOrganizationAction('delete', organization);
      },
      variant: 'destructive' as const,
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Text className="text-lg font-semibold text-foreground">Organization Management</Text>
        <Button onClick={() => window.location.href = '/admin/organizations/create'}>
          Add Organization
        </Button>
      </div>

      {/* Filters */}
      <FiltersPanel
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
      />

      {/* Organizations Table */}
      <DataTable
        data={organizations}
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
