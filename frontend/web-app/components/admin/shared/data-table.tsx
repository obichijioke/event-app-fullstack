'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button, Badge, Text } from '@/components/ui';

export interface Column<T> {
  key: string; // Changed from keyof T to string for flexibility
  title: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    field: string; // Changed from keyof T to string for flexibility
    direction: 'asc' | 'desc';
    onSort: (field: string) => void; // Changed parameter type
  };
  selection?: {
    selectedItems: T[];
    onSelectionChange: (items: T[]) => void;
  };
  actions?: {
    label: string;
    onClick: (item: T) => void | Promise<void>;
    variant?: 'primary' | 'secondary' | 'destructive' | 'success' | 'warning';
    condition?: (item: T) => boolean;
  }[];
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  selection,
  actions,
  className,
}: DataTableProps<T>) {
  const [selectAll, setSelectAll] = React.useState(false);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    if (selection) {
      selection.onSelectionChange(newSelectAll ? [...data] : []);
    }
  };

  const handleSelectItem = (item: T) => {
    if (!selection) return;
    
    const isSelected = selection.selectedItems.some(selected => 
      JSON.stringify(selected) === JSON.stringify(item)
    );
    
    const newSelection = isSelected
      ? selection.selectedItems.filter(selected => 
          JSON.stringify(selected) !== JSON.stringify(item)
        )
      : [...selection.selectedItems, item];
    
    selection.onSelectionChange(newSelection);
  };

  const handleSort = (field: string) => {
    if (!sorting) return;

    sorting.onSort(field);
  };

  const renderCellValue = (column: Column<T>, item: T) => {
    const value = (item as any)[column.key];

    if (column.render) {
      return column.render(value, item);
    }

    if (value === null || value === undefined) {
      return <Text className="text-muted-foreground">—</Text>;
    }

    return <Text>{String(value)}</Text>;
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className={cn('w-full', className)}>
      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {/* Selection column */}
                {selection && (
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                )}
                
                {/* Data columns */}
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      'px-4 py-3 text-left text-sm font-semibold text-foreground',
                      column.width && `w-[${column.width}]`
                    )}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        {column.title}
                        {sorting?.field === column.key && (
                          <SortIcon direction={sorting.direction} />
                        )}
                      </button>
                    ) : (
                      column.title
                    )}
                  </th>
                ))}
                
                {/* Actions column */}
                {actions && actions.length > 0 && (
                  <th className="w-24 px-4 py-3 text-right text-sm font-semibold text-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-border">
              {loading ? (
                // Loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    {selection && (
                      <td className="w-12 px-4 py-3">
                        <div className="h-4 w-4 rounded bg-muted" />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-4 py-3">
                        <div className="h-4 rounded bg-muted" />
                      </td>
                    ))}
                    {actions && (
                      <td className="w-24 px-4 py-3">
                        <div className="h-4 rounded bg-muted" />
                      </td>
                    )}
                  </tr>
                ))
              ) : data.length === 0 ? (
                // Empty state
                <tr>
                  <td
                    colSpan={
                      columns.length +
                      (selection ? 1 : 0) +
                      (actions ? 1 : 0)
                    }
                    className="px-4 py-8 text-center"
                  >
                    <Text className="text-muted-foreground">No data available</Text>
                  </td>
                </tr>
              ) : (
                // Data rows
                data.map((item, index) => (
                  <tr
                    key={index}
                    className={cn(
                      'hover:bg-muted/50 transition-colors',
                      selection?.selectedItems.some(selected => 
                        JSON.stringify(selected) === JSON.stringify(item)
                      ) && 'bg-muted'
                    )}
                  >
                    {/* Selection cell */}
                    {selection && (
                      <td className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selection.selectedItems.some(selected => 
                            JSON.stringify(selected) === JSON.stringify(item)
                          )}
                          onChange={() => handleSelectItem(item)}
                          className="rounded border-border"
                        />
                      </td>
                    )}
                    
                    {/* Data cells */}
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={cn(
                          'px-4 py-3 text-sm',
                          column.width && `w-[${column.width}]`
                        )}
                      >
                        {renderCellValue(column, item)}
                      </td>
                    ))}
                    
                    {/* Actions cell */}
                    {actions && (
                      <td className="w-24 px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {actions
                            .filter(action => !action.condition || action.condition(item))
                            .map((action, actionIndex) => {
                              // Map action variants to Button variants
                              const buttonVariant =
                                action.variant === 'success' ? 'primary' :
                                action.variant === 'warning' ? 'secondary' :
                                action.variant || 'secondary';

                              return (
                                <Button
                                  key={actionIndex}
                                  variant={buttonVariant}
                                  size="sm"
                                  onClick={() => action.onClick(item)}
                                >
                                  {action.label}
                                </Button>
                              );
                            })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === pagination.page;
                
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => pagination.onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sort icon component
function SortIcon({ direction }: { direction: 'asc' | 'desc' }) {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {direction === 'asc' ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      )}
    </svg>
  );
}