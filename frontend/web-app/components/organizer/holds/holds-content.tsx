'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Loader2,
  Trash2,
  Clock,
  User,
  Ticket,
  AlertCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import toast from 'react-hot-toast';
import type { Hold } from '@/lib/types/organizer';

interface HoldsContentProps {
  eventId: string;
}

interface HoldStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

export function HoldsContent({ eventId }: HoldsContentProps) {
  const { currentOrganization } = useOrganizerStore();
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring'>('all');
  const [stats, setStats] = useState<HoldStats>({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
  });

  useEffect(() => {
    loadHolds();

    // Auto-refresh every 30 seconds to update expiry timers
    const interval = setInterval(loadHolds, 30000);
    return () => clearInterval(interval);
  }, [eventId, currentOrganization]);

  const loadHolds = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const data = await organizerApi.holds.list(eventId, currentOrganization.id);
      setHolds(data);
      calculateStats(data);
    } catch (error) {
      console.error('Failed to load holds:', error);
      toast.error('Failed to load holds');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (holdsData: Hold[]) => {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const active = holdsData.filter((h) => new Date(h.expiresAt) > now);
    const expiringSoon = holdsData.filter((h) => {
      const expiryDate = new Date(h.expiresAt);
      return expiryDate > now && expiryDate <= oneHourFromNow;
    });
    const expired = holdsData.filter((h) => new Date(h.expiresAt) <= now);

    setStats({
      total: holdsData.length,
      active: active.length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
    });
  };

  const handleReleaseHold = async (holdId: string) => {
    if (!currentOrganization) return;
    if (!confirm('Are you sure you want to release this hold?')) return;

    try {
      await organizerApi.holds.delete(holdId, currentOrganization.id);
      toast.success('Hold released successfully');
      loadHolds();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to release hold');
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return diff > 0 && diff <= 60 * 60 * 1000; // Within 1 hour
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  const filteredHolds = holds.filter((hold) => {
    if (filter === 'active') return !isExpired(hold.expiresAt);
    if (filter === 'expiring') return isExpiringSoon(hold.expiresAt);
    return true;
  });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please select an organization</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Holds</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <Ticket className="w-8 h-8 text-primary opacity-20" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.active}</p>
            </div>
            <Clock className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">{stats.expiringSoon}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-600 opacity-20" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{stats.expired}</p>
            </div>
            <Clock className="w-8 h-8 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Holds</option>
            <option value="active">Active Only</option>
            <option value="expiring">Expiring Soon</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHolds}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-secondary transition text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Hold
          </button>
        </div>
      </div>

      {/* Holds Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredHolds.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No holds found</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
          >
            Create First Hold
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Hold ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Expires</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Time Left</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredHolds.map((hold) => {
                  const expired = isExpired(hold.expiresAt);
                  const expiringSoon = isExpiringSoon(hold.expiresAt);

                  return (
                    <tr key={hold.id} className={expired ? 'opacity-50' : ''}>
                      <td className="px-4 py-3 text-sm font-mono">{hold.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-secondary rounded text-xs">
                          {hold.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{hold.quantity}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(hold.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(hold.expiresAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`font-medium ${
                            expired
                              ? 'text-red-600'
                              : expiringSoon
                              ? 'text-amber-600'
                              : 'text-green-600'
                          }`}
                        >
                          {getTimeRemaining(hold.expiresAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleReleaseHold(hold.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Release hold"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Hold Dialog */}
      {showCreateDialog && (
        <CreateHoldDialog
          eventId={eventId}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadHolds();
          }}
        />
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">About Inventory Holds</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Holds reserve tickets or seats temporarily for organizer purposes</li>
          <li>Common reasons: VIP reservations, complimentary tickets, group bookings</li>
          <li>Holds automatically expire after the specified time</li>
          <li>Released holds return inventory to available pool</li>
          <li>Active holds prevent public purchase of reserved items</li>
        </ul>
      </div>
    </div>
  );
}

// Create Hold Dialog Component
interface CreateHoldDialogProps {
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateHoldDialog({ eventId, onClose, onSuccess }: CreateHoldDialogProps) {
  const { currentOrganization } = useOrganizerStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ticketTypeId: '',
    quantity: 1,
    reason: 'organizer_hold' as 'checkout' | 'reservation' | 'organizer_hold',
    expiresInHours: 24,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + formData.expiresInHours);

      await organizerApi.holds.create(
        eventId,
        {
          ticketTypeId: formData.ticketTypeId,
          quantity: formData.quantity,
          reason: formData.reason,
          expiresAt: expiresAt.toISOString(),
        },
        currentOrganization.id
      );

      toast.success('Hold created successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create hold');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Create Inventory Hold</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Ticket Type ID (Optional)
            </label>
            <input
              type="text"
              value={formData.ticketTypeId}
              onChange={(e) => setFormData({ ...formData, ticketTypeId: e.target.value })}
              placeholder="Leave empty for general hold"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Specify a ticket type ID or leave empty for event-wide hold
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="organizer_hold">Organizer Hold</option>
              <option value="reservation">Reservation</option>
              <option value="checkout">Checkout</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Expires In (Hours) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="168"
              required
              value={formData.expiresInHours}
              onChange={(e) =>
                setFormData({ ...formData, expiresInHours: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Maximum 168 hours (7 days)</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-secondary transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Hold'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
