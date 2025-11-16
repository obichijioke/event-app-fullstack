'use client';

import * as React from 'react';
import { DataTable, FiltersPanel, StatusBadge } from '@/components/admin';
import { Button, Text } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { adminApiService, type AdminUser } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Edit2, Trash2, Eye, Ban, CheckCircle, UserCog } from 'lucide-react';

interface UserListProps {
  className?: string;
}

interface EditUserFormData {
  name: string;
  phone: string;
  role: 'attendee' | 'organizer' | 'moderator' | 'admin';
  status: string;
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
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null);
  const [editFormData, setEditFormData] = React.useState<EditUserFormData>({
    name: '',
    phone: '',
    role: 'attendee',
    status: 'active',
  });
  const [saving, setSaving] = React.useState(false);

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
          if (!confirm(`Are you sure you want to suspend user "${user.name || user.email}"?`)) return;
          await adminApiService.suspendUser(accessToken, user.id);
          toast.success('User suspended successfully');
          break;
        case 'activate':
          await adminApiService.activateUser(accessToken, user.id);
          toast.success('User activated successfully');
          break;
        case 'delete':
          if (!confirm(`Are you sure you want to delete user "${user.name || user.email}"? This action cannot be undone.`)) return;
          await adminApiService.deleteUser(accessToken, user.id);
          toast.success('User deleted successfully');
          break;
      }

      // Reload users to reflect changes
      await loadUsers();
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleOpenEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setEditFormData({
      name: '',
      phone: '',
      role: 'attendee',
      status: 'active',
    });
  };

  const handleSaveEdit = async () => {
    if (!accessToken || !editingUser) return;

    setSaving(true);
    try {
      await adminApiService.updateUser(accessToken, editingUser.id, {
        name: editFormData.name || undefined,
        phone: editFormData.phone || undefined,
        role: editFormData.role,
        status: editFormData.status,
      });
      toast.success('User updated successfully');
      handleCloseEditModal();
      await loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
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
      onClick: (targetUser: AdminUser) => {
        window.location.href = `/admin/users/${targetUser.id}`;
      },
      icon: Eye,
    },
    {
      label: 'Quick Edit',
      onClick: (targetUser: AdminUser) => {
        handleOpenEditModal(targetUser);
      },
      icon: Edit2,
      variant: 'primary' as const,
    },
    {
      label: 'Manage Roles',
      onClick: (targetUser: AdminUser) => {
        window.location.href = `/admin/users/${targetUser.id}/manage`;
      },
      icon: UserCog,
      variant: 'secondary' as const,
    },
    {
      label: 'Suspend',
      onClick: (targetUser: AdminUser) => handleUserAction('suspend', targetUser),
      icon: Ban,
      variant: 'warning' as const,
      condition: (targetUser: AdminUser) => targetUser.role !== 'admin' && targetUser.status !== 'suspended',
    },
    {
      label: 'Activate',
      onClick: (targetUser: AdminUser) => handleUserAction('activate', targetUser),
      icon: CheckCircle,
      variant: 'success' as const,
      condition: (targetUser: AdminUser) => targetUser.status === 'suspended',
    },
    {
      label: 'Delete',
      onClick: (targetUser: AdminUser) => handleUserAction('delete', targetUser),
      icon: Trash2,
      variant: 'destructive' as const,
      condition: (targetUser: AdminUser) => targetUser.role !== 'admin',
    },
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

      {/* Quick Edit User Modal */}
      <Modal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        title={`Quick Edit User: ${editingUser?.name || editingUser?.email || ''}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <Input
                type="text"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Platform Role *
              </label>
              <Select
                value={editFormData.role}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    role: e.target.value as EditUserFormData['role'],
                  }))
                }
              >
                <option value="attendee">Attendee</option>
                <option value="organizer">Organizer</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </Select>
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
          </div>

          {editingUser && (
            <div className="mt-4 p-4 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {editingUser.email}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Created:</strong> {new Date(editingUser.createdAt).toLocaleDateString()}
              </p>
              {editingUser.lastLoginAt && (
                <p className="text-sm text-muted-foreground">
                  <strong>Last Login:</strong> {new Date(editingUser.lastLoginAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

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
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
