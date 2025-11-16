'use client';

interface NotificationFiltersProps {
  activeFilter: 'all' | 'unread' | 'read';
  onFilterChange: (filter: 'all' | 'unread' | 'read') => void;
  unreadCount: number;
}

export function NotificationFilters({ activeFilter, onFilterChange, unreadCount }: NotificationFiltersProps) {
  const filters: Array<{ key: 'all' | 'unread' | 'read'; label: string; count?: number }> = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'read', label: 'Read' },
  ];

  return (
    <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            activeFilter === filter.key
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {filter.label}
          {filter.count !== undefined && filter.count > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
