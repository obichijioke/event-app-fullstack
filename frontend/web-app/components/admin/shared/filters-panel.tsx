'use client';

import * as React from 'react';
import { Button, Input, Select, Text } from '@/components/ui';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange';
  options?: FilterOption[];
  placeholder?: string;
}

interface FiltersPanelProps {
  fields: FilterField[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  onReset: () => void;
  className?: string;
}

export function FiltersPanel({
  fields,
  values,
  onChange,
  onReset,
  className,
}: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleFieldChange = (key: string, value: unknown) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  const handleReset = () => {
    onReset();
  };

  const hasActiveFilters = Object.keys(values).length > 0;

  const renderField = (field: FilterField) => {
    const value = values[field.key];

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full"
          />
        );

      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            options={field.options}
            className="w-full"
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full"
          />
        );

      case 'daterange':
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={(value as { start?: string; end?: string })?.start || ''}
              onChange={(e) =>
                handleFieldChange(field.key, {
                  ...(value as { start?: string; end?: string }),
                  start: e.target.value,
                })
              }
              placeholder="Start date"
              className="flex-1"
            />
            <Input
              type="date"
              value={(value as { start?: string; end?: string })?.end || ''}
              onChange={(e) =>
                handleFieldChange(field.key, {
                  ...(value as { start?: string; end?: string }),
                  end: e.target.value,
                })
              }
              placeholder="End date"
              className="flex-1"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('border border-border rounded-lg bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Text className="font-semibold text-foreground">Filters</Text>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            <ChevronIcon
              className={cn(
                'ml-1 h-4 w-4 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Text className="text-sm font-medium text-foreground">
                  {field.label}
                </Text>
                {renderField(field)}
              </div>
            ))}
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="mt-4 border-t border-border pt-4">
              <Text className="mb-2 text-sm font-medium text-foreground">
                Active Filters:
              </Text>
              <div className="flex flex-wrap gap-2">
                {Object.entries(values).map(([key, value]) => {
                  const field = fields.find(f => f.key === key);
                  if (!field || !value) return null;

                  let displayValue = String(value);
                  if (field.type === 'select' && field.options) {
                    const option = field.options.find(opt => opt.value === value);
                    displayValue = option?.label || displayValue;
                  }

                  if (field.type === 'daterange' && typeof value === 'object') {
                    const range = value as { start?: string; end?: string };
                    displayValue = `${range.start || ''} - ${range.end || ''}`;
                  }

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground"
                    >
                      <Text className="font-medium">{field.label}:</Text>
                      <Text>{displayValue}</Text>
                      <button
                        onClick={() => handleFieldChange(key, undefined)}
                        className="ml-1 text-muted-foreground hover:text-error"
                      >
                        <CloseIcon className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Icon Components
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}