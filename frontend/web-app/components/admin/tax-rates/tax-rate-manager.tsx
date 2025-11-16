'use client';

import * as React from 'react';
import { adminApiService, type AdminTaxRate, type AdminTaxRateStats } from '@/services/admin-api.service';
import { useAuth } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui';
import { cn } from '@/lib/utils';

interface TaxRateManagerProps {
  className?: string;
}

export function TaxRateManager({ className }: TaxRateManagerProps) {
  const { accessToken } = useAuth();
  const [taxRates, setTaxRates] = React.useState<AdminTaxRate[]>([]);
  const [stats, setStats] = React.useState<AdminTaxRateStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [selectedRate, setSelectedRate] = React.useState<AdminTaxRate | null>(null);
  const [formData, setFormData] = React.useState({
    country: '',
    region: '',
    city: '',
    postal: '',
    rate: 0,
    name: '',
    active: true,
  });
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  React.useEffect(() => {
    if (!accessToken) return;
    loadTaxRates();
    loadStats();
  }, [accessToken, filters, pagination.page]);

  const loadTaxRates = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await adminApiService.getTaxRates(accessToken, {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search as string,
        country: filters.country as string,
        active: filters.active as boolean | undefined,
      });

      if (response.success && response.data) {
        setTaxRates(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load tax rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!accessToken) return;
    try {
      const response = await adminApiService.getTaxRateStats(accessToken);
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
      await adminApiService.createTaxRate({
        country: formData.country,
        region: formData.region || undefined,
        city: formData.city || undefined,
        postal: formData.postal || undefined,
        rate: formData.rate / 100, // Convert percentage to decimal
        name: formData.name,
        active: formData.active,
      }, accessToken);
      setShowCreateDialog(false);
      resetForm();
      loadTaxRates();
      loadStats();
    } catch (error) {
      console.error('Failed to create tax rate:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRate || !accessToken) return;
    try {
      await adminApiService.updateTaxRate(selectedRate.id, {
        country: formData.country,
        region: formData.region || undefined,
        city: formData.city || undefined,
        postal: formData.postal || undefined,
        rate: formData.rate / 100, // Convert percentage to decimal
        name: formData.name,
        active: formData.active,
      }, accessToken);
      setShowEditDialog(false);
      setSelectedRate(null);
      resetForm();
      loadTaxRates();
    } catch (error) {
      console.error('Failed to update tax rate:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this tax rate?')) return;
    try {
      await adminApiService.deleteTaxRate(id, accessToken);
      loadTaxRates();
      loadStats();
    } catch (error) {
      console.error('Failed to delete tax rate:', error);
    }
  };

  const handleToggleActive = async (rate: AdminTaxRate) => {
    if (!accessToken) return;
    try {
      await adminApiService.updateTaxRate(
        rate.id,
        { active: !rate.active },
        accessToken
      );
      loadTaxRates();
    } catch (error) {
      console.error('Failed to toggle active status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      country: '',
      region: '',
      city: '',
      postal: '',
      rate: 0,
      name: '',
      active: true,
    });
  };

  const openEditDialog = (rate: AdminTaxRate) => {
    setSelectedRate(rate);
    setFormData({
      country: rate.country,
      region: rate.region || '',
      city: rate.city || '',
      postal: rate.postal || '',
      rate: rate.rate * 100, // Convert decimal to percentage
      name: rate.name,
      active: rate.active,
    });
    setShowEditDialog(true);
  };

  const loadPreset = (preset: string) => {
    const presets: Record<string, any> = {
      'us-sales': { country: 'US', name: 'Sales Tax', rate: 7.25 },
      'uk-vat': { country: 'GB', name: 'VAT', rate: 20 },
      'eu-vat': { country: 'EU', name: 'VAT', rate: 21 },
      'ng-vat': { country: 'NG', name: 'VAT', rate: 7.5 },
    };
    if (presets[preset]) {
      setFormData({ ...formData, ...presets[preset] });
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Rate Configuration</h1>
          <p className="text-muted-foreground mt-1">Configure tax rates for different jurisdictions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>Create Tax Rate</Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Tax Rates</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Active Rates</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Countries</p>
            <p className="text-2xl font-bold">{stats.countriesCount}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">Average Rate</p>
            <p className="text-2xl font-bold">{stats.averageRate}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="search"
          placeholder="Search by name or postal code..."
          className="flex-1 px-4 py-2 border rounded-lg"
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <input
          type="text"
          placeholder="Country (e.g., US, GB, NG)"
          className="px-4 py-2 border rounded-lg w-48"
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
        />
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
                <th className="text-left p-4 font-semibold">Country</th>
                <th className="text-left p-4 font-semibold">Region</th>
                <th className="text-left p-4 font-semibold">City</th>
                <th className="text-left p-4 font-semibold">Postal</th>
                <th className="text-left p-4 font-semibold">Rate</th>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    Loading tax rates...
                  </td>
                </tr>
              ) : taxRates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    No tax rates found
                  </td>
                </tr>
              ) : (
                taxRates.map((rate) => (
                  <tr key={rate.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">
                      <Text className="font-medium">{rate.country}</Text>
                    </td>
                    <td className="p-4">
                      <Text className="text-sm">{rate.region || '-'}</Text>
                    </td>
                    <td className="p-4">
                      <Text className="text-sm">{rate.city || '-'}</Text>
                    </td>
                    <td className="p-4">
                      <Text className="text-sm">{rate.postal || '-'}</Text>
                    </td>
                    <td className="p-4">
                      <Text className="font-mono">{(rate.rate * 100).toFixed(2)}%</Text>
                    </td>
                    <td className="p-4">
                      <Text>{rate.name}</Text>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(rate)}
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium border cursor-pointer',
                          rate.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                        )}
                      >
                        {rate.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(rate)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(rate.id)}>
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
            <h2 className="text-xl font-bold mb-4">Create Tax Rate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quick Presets</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  onChange={(e) => loadPreset(e.target.value)}
                >
                  <option value="">-- Select a preset --</option>
                  <option value="us-sales">US Sales Tax (7.25%)</option>
                  <option value="uk-vat">UK VAT (20%)</option>
                  <option value="eu-vat">EU VAT (21%)</option>
                  <option value="ng-vat">Nigeria VAT (7.5%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country Code *</label>
                <input
                  type="text"
                  maxLength={2}
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                  placeholder="US, GB, NG, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Region/State</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="California, Lagos, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Postal/ZIP Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.postal}
                  onChange={(e) => setFormData({ ...formData, postal: e.target.value })}
                  placeholder="94102"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Rate (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                  placeholder="7.25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sales Tax, VAT, GST"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active-create"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <label htmlFor="active-create" className="text-sm font-medium">Active</label>
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
      {showEditDialog && selectedRate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Tax Rate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Country Code</label>
                <input
                  type="text"
                  maxLength={2}
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Region/State</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {setShowEditDialog(false); setSelectedRate(null); resetForm();}}>
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
