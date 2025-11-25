'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Clock, FileText, GripVertical } from 'lucide-react';

interface AgendaItemCardProps {
  index: number;
  time?: string;
  title: string;
  onTimeChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onRemove: () => void;
  error?: string;
}

export function AgendaItemCard({
  index,
  time,
  title,
  onTimeChange,
  onTitleChange,
  onRemove,
  error,
}: AgendaItemCardProps) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-muted-foreground/30">
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Item {index + 1}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* Time Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Time
              </label>
              <Input
                type="time"
                value={time || ''}
                onChange={(e) => onTimeChange(e.target.value)}
                className="text-sm"
                placeholder="10:00"
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Activity
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Registration opens"
                className="text-sm"
              />
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
