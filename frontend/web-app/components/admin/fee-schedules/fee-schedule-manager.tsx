'use client';

import * as React from 'react';
import { adminApiService, type AdminFeeSchedule, type AdminFeeScheduleStats } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { cn } from '@/lib/utils';

interface FeeScheduleManagerProps {
  className?: string;
}

export function FeeScheduleManager({ className }: FeeScheduleManagerProps) {
  const { accessToken } = useAuth();
  const [feeSchedules, setFeeSchedules] = React.useState<AdminFeeSchedule[]>([]);
  const [stats, setStats] = React.useState<AdminFeeScheduleStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [selectedSchedule, setSelectedSchedule] = React.useState<AdminFeeSchedule | null>(null);
  const [formData, setFormData] = React.useState({
    kind: 'platform' as 'platform' | 'processing',
    name: '',
    percent: 0,
    fixedCents: 0,
    currency: 'USD',
    active: true,
  });
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  React.useEffect(() => {
    if (!accessToken) return;
    loadFeeSchedules();
    loadStats();
  }, [accessToken, filters, pagination.page]);

  const loadFeeSchedules = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await adminApiService.getFeeSchedules(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        kind: filters.kind as 'platform' | 'processing' | undefined,
        active: filters.active as boolean | undefined,
      });

      if (response.success && response.data) {
        setFeeSchedules(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load fee schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!accessToken) return;
    try {
      const response = await adminApiService.getFeeScheduleStats(accessToken);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreate = async () => {
    if (!accessToken) return;
    try {
      await adminApiService.createFeeSchedule(formData, accessToken);
      setShowCreateDialog(false);
      resetForm();
      loadFeeSchedules();
      loadStats();
    } catch (error) {
      console.error('Failed to create fee schedule:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSchedule || !accessToken) return;
    try {
      await adminApiService.updateFeeSchedule(selectedSchedule.id, formData, accessToken);
      setShowEditDialog(false);
      setSelectedSchedule(null);
      resetForm();
      loadFeeSchedules();
    } catch (error) {
      console.error('Failed to update fee schedule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this fee schedule?')) return;
    try {
      await adminApiService.deleteFeeSchedule(id, accessToken);
      loadFeeSchedules();
      loadStats();
    } catch (error) {
      console.error('Failed to delete fee schedule:', error);
    }
  };

  const handleToggleActive = async (schedule: AdminFeeSchedule) => {
    if (!accessToken) return;
    try {
      await adminApiService.updateFeeSchedule(
        schedule.id,
        { active: !schedule.active },
        accessToken
      );
      loadFeeSchedules();
    } catch (error) {
      console.error('Failed to toggle active status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      kind: 'platform',
      name: '',
      percent: 0,
      fixedCents: 0,
      currency: 'USD',
      active: true,
    });
  };

  const openEditDialog = (schedule: AdminFeeSchedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      kind: schedule.kind,
      name: schedule.name,
      percent: schedule.percent,
      fixedCents: schedule.fixedCents,
      currency: schedule.currency || 'USD',
      active: schedule.active,
    });
    setShowEditDialog(true);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Schedule Management</h1>
          <p className="text-muted-foreground mt-1">Manage platform and processing fees</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>Create Fee Schedule</Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Schedules</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Active Platform Fees</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activePlatform}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Active Processing Fees</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeProcessing}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Org Overrides</p>
            <p className="text-2xl font-bold">{stats.totalOverrides}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="search"
          placeholder="Search by name..."
          className="flex-1 px-4 py-2 border rounded-lg"
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="px-4 py-2 border rounded-lg"
          onChange={(e) => setFilters({ ...filters, kind: e.target.value || undefined })}
        >
          <option value="">All Types</option>
          <option value="platform">Platform Fees</option>
          <option value="processing">Processing Fees</option>
        </select>
        <select
          className="px-4 py-2 border rounded-lg"
          onChange={(e) => setFilters({ ...filters, active: e.target.value ? e.target.value === 'true' : undefined })}
        >
          <option value="">All Status</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Percent</th>
                <th className="text-left p-4 font-semibold">Fixed Fee</th>
                <th className="text-left p-4 font-semibold">Currency</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    Loading fee schedules...
                  </td>
                </tr>
              ) : feeSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    No fee schedules found
                  </td>
                </tr>
              ) : (
                feeSchedules.map((schedule) => (
                  <tr key={schedule.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">
                      <Text className="font-medium">{schedule.name}</Text>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium border',
                        schedule.kind === 'platform' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-green-100 text-green-800 border-green-200'
                      )}>
                        {schedule.kind}
                      </span>
                    </td>
                    <td className="p-4">
                      <Text>{schedule.percent}%</Text>
                    </td>
                    <td className="p-4">
                      <Text>
                        <CurrencyDisplay
                          amountCents={schedule.fixedCents}
                          currency={schedule.currency || 'USD'}
                          showFree={false}
                        />
                      </Text>
                    </td>
                    <td className="p-4">
                      <Text>{schedule.currency || 'USD'}</Text>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(schedule)}
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium border cursor-pointer',
                          schedule.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                        )}
                      >
                        {schedule.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(schedule)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(schedule.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Fee Schedule</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.kind}
                  onChange={(e) => setFormData({ ...formData, kind: e.target.value as 'platform' | 'processing' })}
                >
                  <option value="platform">Platform Fee</option>
                  <option value="processing">Processing Fee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Standard Platform Fee"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Percent (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.percent}
                  onChange={(e) => setFormData({ ...formData, percent: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fixed Fee (cents)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.fixedCents}
                  onChange={(e) => setFormData({ ...formData, fixedCents: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="NGN">NGN</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <label htmlFor="active" className="text-sm font-medium">Active</label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {setShowCreateDialog(false); resetForm();}}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Fee Schedule</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Percent (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.percent}
                  onChange={(e) => setFormData({ ...formData, percent: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fixed Fee (cents)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.fixedCents}
                  onChange={(e) => setFormData({ ...formData, fixedCents: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {setShowEditDialog(false); setSelectedSchedule(null); resetForm();}}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>Update</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
