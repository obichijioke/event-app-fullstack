'use client';

import { Search, Filter } from 'lucide-react';
import { EventStatus } from '@/lib/types/organizer';

interface EventFiltersProps {
  search: string;
  status: EventStatus | 'all';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: EventStatus | 'all') => void;
  onClearFilters: () => void;
}

export function EventFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onClearFilters,
}: EventFiltersProps) {
  const statuses: Array<{ value: EventStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Events' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'live', label: 'Live' },
    { value: 'paused', label: 'Paused' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'completed', label: 'Completed' },
  ];

  const hasActiveFilters = search !== '' || status !== 'all';

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="ml-auto text-sm text-primary hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Search Events
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by title..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as EventStatus | 'all')}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
