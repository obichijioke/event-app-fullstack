'use client';

import React from 'react';
import { Calendar, CalendarDays, Repeat } from 'lucide-react';

type EventMode = 'single' | 'multi_day' | 'recurring';

interface EventModeSelectorProps {
  value: EventMode;
  onChange: (mode: EventMode) => void;
  disabled?: boolean;
}

const modes = [
  {
    value: 'single' as const,
    label: 'Single event',
    description: 'One date and time',
    icon: Calendar,
    example: 'Dec 25, 8:00 PM',
  },
  {
    value: 'multi_day' as const,
    label: 'Multi-day',
    description: 'Multiple specific dates',
    icon: CalendarDays,
    example: 'Dec 24, 25, 26',
  },
  {
    value: 'recurring' as const,
    label: 'Recurring',
    description: 'Repeating pattern',
    icon: Repeat,
    example: 'Every Monday',
  },
];

export function EventModeSelector({ value, onChange, disabled }: EventModeSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Event type</label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose how your event is scheduled
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = value === mode.value;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => !disabled && onChange(mode.value)}
              disabled={disabled}
              className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-background hover:border-muted-foreground/30 hover:bg-muted/50'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              {/* Icon */}
              <div
                className={`rounded-lg p-2 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {mode.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mode.description}
                </p>
                <p className="text-xs font-mono text-muted-foreground/70 mt-2 border-t border-border/50 pt-2">
                  {mode.example}
                </p>
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
