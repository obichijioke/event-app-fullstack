"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { adminApiService, type AdminUser } from "@/services/admin-api.service";
import { useAuth } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import toast from "react-hot-toast";
import { Edit2, Shield, Ban, CheckCircle, Trash2 } from "lucide-react";

type Props = {
  params: Promise<{ userId: string }>;
};

interface EditUserFormData {
  name: string;
  phone: string;
  role: 'attendee' | 'organizer' | 'moderator' | 'admin';
  status: string;
}

export default function UserDetailsPage({ params }: Props) {
  const { userId } = use(params);
  const { accessToken } = useAuth();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<EditUserFormData>({
    name: '',
    phone: '',
    role: 'attendee',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  // Load user data
  useEffect(() => {
    if (!accessToken || !userId) return;

    const loadUser = async () => {
      try {
        setLoading(true);
        const response = await adminApiService.getUser(accessToken, userId);
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        toast.error('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [accessToken, userId]);

  const handleOpenEditModal = () => {
    if (!user) return;
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
    setEditFormData({
      name: '',
      phone: '',
      role: 'attendee',
      status: 'active',
    });
  };

  const handleSaveEdit = async () => {
    if (!accessToken || !user) return;

    setSaving(true);
    try {
      await adminApiService.updateUser(accessToken, user.id, {
        name: editFormData.name || undefined,
        phone: editFormData.phone || undefined,
        role: editFormData.role,
        status: editFormData.status,
      });
      toast.success('User updated successfully');

      // Reload user data
      const response = await adminApiService.getUser(accessToken, userId);
      if (response.success && response.data) {
        setUser(response.data);
      }

      handleCloseEditModal();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!accessToken || !user) return;
    if (!confirm(`Are you sure you want to suspend "${user.name || user.email}"?`)) return;

    try {
      await adminApiService.suspendUser(accessToken, user.id);
      toast.success('User suspended successfully');

      // Reload user data
      const response = await adminApiService.getUser(accessToken, userId);
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to suspend user:', error);
      toast.error('Failed to suspend user');
    }
  };

  const handleActivate = async () => {
    if (!accessToken || !user) return;

    try {
      await adminApiService.activateUser(accessToken, user.id);
      toast.success('User activated successfully');

      // Reload user data
      const response = await adminApiService.getUser(accessToken, userId);
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to activate user:', error);
      toast.error('Failed to activate user');
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !user) return;
    if (!confirm(`Are you sure you want to delete "${user.name || user.email}"? This action cannot be undone.`)) return;

    try {
      await adminApiService.deleteUser(accessToken, user.id);
      toast.success('User deleted successfully');
      window.location.href = '/admin/users';
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Details</h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Users
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">User Information</h2>
            <Button onClick={handleOpenEditModal} variant="outline" size="sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="mt-1 text-base">{user.name || 'Not provided'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1 text-base">{user.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="mt-1 text-base">{user.phone || 'Not provided'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Platform Role</label>
              <p className="mt-1 text-base capitalize">{user.role}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <p className="mt-1 text-base capitalize">{user.status}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
              <p className="mt-1 text-base">
                {user.emailVerifiedAt
                  ? new Date(user.emailVerifiedAt).toLocaleDateString()
                  : 'Not verified'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="mt-1 text-base">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Login</label>
              <p className="mt-1 text-base">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4 h-fit">
          <h2 className="text-xl font-semibold">Quick Actions</h2>

          <div className="space-y-2">
            <Button
              onClick={() => window.location.href = `/admin/users/${userId}/manage`}
              variant="outline"
              className="w-full justify-start"
            >
              <Shield className="w-4 h-4 mr-2" />
              Manage Roles
            </Button>

            {user.status !== 'suspended' && user.role !== 'admin' && (
              <Button
                onClick={handleSuspend}
                variant="warning"
                className="w-full justify-start"
              >
                <Ban className="w-4 h-4 mr-2" />
                Suspend User
              </Button>
            )}

            {user.status === 'suspended' && (
              <Button
                onClick={handleActivate}
                variant="success"
                className="w-full justify-start"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate User
              </Button>
            )}

            {user.role !== 'admin' && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="w-full justify-start"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      <Modal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        title={`Edit User: ${user.name || user.email}`}
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
