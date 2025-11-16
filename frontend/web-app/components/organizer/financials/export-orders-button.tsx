'use client';

import { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { organizerApi } from '@/lib/api/organizer-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import toast from 'react-hot-toast';

interface ExportOrdersButtonProps {
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function ExportOrdersButton({ variant = 'secondary', className = '' }: ExportOrdersButtonProps) {
  const { currentOrganization } = useOrganizerStore();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = async () => {
    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    setLoading(true);
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const blob = await organizerApi.financials.exportOrders(currentOrganization.id, params);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const filename = `orders-export-${currentOrganization.id}-${new Date().toISOString().split('T')[0]}.csv`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Orders exported successfully');
      setShowDatePicker(false);
    } catch (error: any) {
      console.error('Failed to export orders:', error);
      toast.error(error?.message || 'Failed to export orders');
    } finally {
      setLoading(false);
    }
  };

  const baseStyles = 'flex items-center gap-2 px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'border border-border hover:bg-secondary',
  };

  if (showDatePicker) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date (Optional)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm disabled:opacity-50"
            >
              {loading ? 'Exporting...' : 'Export'}
            </button>
            <button
              onClick={() => setShowDatePicker(false)}
              className="flex-1 px-3 py-2 border border-border rounded-md hover:bg-secondary transition text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowDatePicker(true)}
      disabled={loading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      <Download className="w-4 h-4" />
      Export Orders
    </button>
  );
}
