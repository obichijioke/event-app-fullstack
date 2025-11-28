'use client';

import React from 'react';
import { Globe, Link as LinkIcon, Lock } from 'lucide-react';

type Visibility = 'public' | 'unlisted' | 'private';

interface VisibilitySelectorProps {
  value: Visibility;
  onChange: (value: Visibility) => void;
  disabled?: boolean;
}

const visibilityOptions = [
  {
    value: 'public' as const,
    label: 'Public',
    description: 'Anyone can find and view',
    icon: Globe,
  },
  {
    value: 'unlisted' as const,
    label: 'Unlisted',
    description: 'Only people with the link',
    icon: LinkIcon,
  },
  {
    value: 'private' as const,
    label: 'Private',
    description: 'Invitation only',
    icon: Lock,
  },
];

export function VisibilitySelector({ value, onChange, disabled }: VisibilitySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Event Visibility</label>
      <p className="text-xs text-muted-foreground">
        Control who can discover and access your event
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {visibilityOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
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
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {option.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
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
