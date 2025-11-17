'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Button, Text } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { adminApiService, type AdminOrganization } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Edit2, Trash2, Eye, Ban } from 'lucide-react';

interface OrganizationListProps {
  className?: string;
}

interface EditFormData {
  name: string;
  legalName: string;
  website: string;
  status: string;
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
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingOrg, setEditingOrg] = React.useState<AdminOrganization | null>(null);
  const [editFormData, setEditFormData] = React.useState<EditFormData>({
    name: '',
    legalName: '',
    website: '',
    status: '',
  });
  const [saving, setSaving] = React.useState(false);

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
          if (!confirm(`Are you sure you want to suspend "${organization.name}"?`)) return;
          await adminApiService.updateOrganization(accessToken, organization.id, { status: 'suspended' });
          toast.success('Organization suspended successfully');
          break;
        case 'delete':
          if (!confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone.`)) return;
          await adminApiService.updateOrganization(accessToken, organization.id, { status: 'deleted' });
          toast.success('Organization deleted successfully');
          break;
      }

      // Reload organizations to reflect changes
      await loadOrganizations();
    } catch (error) {
      console.error(`Failed to ${action} organization:`, error);
      toast.error(`Failed to ${action} organization`);
    }
  };

  const handleOpenEditModal = (organization: AdminOrganization) => {
    setEditingOrg(organization);
    setEditFormData({
      name: organization.name,
      legalName: organization.legalName || '',
      website: organization.website || '',
      status: organization.status,
    });
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingOrg(null);
    setEditFormData({
      name: '',
      legalName: '',
      website: '',
      status: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!accessToken || !editingOrg) return;

    setSaving(true);
    try {
      await adminApiService.updateOrganization(accessToken, editingOrg.id, {
        name: editFormData.name,
        legalName: editFormData.legalName || undefined,
        website: editFormData.website || undefined,
        status: editFormData.status as any,
      });
      toast.success('Organization updated successfully');
      handleCloseEditModal();
      await loadOrganizations();
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error('Failed to update organization');
    } finally {
      setSaving(false);
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
        window.location.href = `/admin/organizations/${organization.id}`;
      },
      icon: Eye,
    },
    {
      label: 'Edit',
      onClick: (organization: AdminOrganization) => {
        handleOpenEditModal(organization);
      },
      icon: Edit2,
      variant: 'primary' as const,
    },
    {
      label: 'Suspend',
      onClick: (organization: AdminOrganization) => {
        handleOrganizationAction('suspend', organization);
      },
      icon: Ban,
      variant: 'warning' as const,
      condition: (organization: AdminOrganization) => organization.status !== 'suspended',
    },
    {
      label: 'Delete',
      onClick: (organization: AdminOrganization) => {
        handleOrganizationAction('delete', organization);
      },
      icon: Trash2,
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

      {/* Edit Organization Modal */}
      <Modal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        title={`Edit Organization: ${editingOrg?.name || ''}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Organization Name *
              </label>
              <Input
                type="text"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Organization Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Legal Name
              </label>
              <Input
                type="text"
                value={editFormData.legalName}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    legalName: e.target.value,
                  }))
                }
                placeholder="Legal Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Website
              </label>
              <Input
                type="url"
                value={editFormData.website}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Status *
              </label>
              <Select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
              >
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editFormData.name}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
