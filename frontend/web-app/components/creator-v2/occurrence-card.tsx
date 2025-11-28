'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, X, Calendar, Clock, MapPin, DoorOpen, Users, AlertCircle } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';

interface OccurrenceCardProps {
  index: number;
  startsAt: string;
  endsAt?: string;
  doorTime?: string;
  capacityOverride?: number;
  venueId?: string;
  isCanceled?: boolean;
  venues: Array<{ id: string; name: string; address?: { city?: string } }>;
  venuesLoading?: boolean;
  defaultVenueName?: string;
  onStartChange: (value: string | undefined) => void;
  onEndChange: (value: string | undefined) => void;
  onDoorTimeChange: (value: string | undefined) => void;
  onCapacityChange: (value: number | undefined) => void;
  onVenueChange: (value: string | undefined) => void;
  onCancelToggle: (canceled: boolean) => void;
  onRemove: () => void;
  canRemove?: boolean;
}

export function OccurrenceCard({
  index,
  startsAt,
  endsAt,
  doorTime,
  capacityOverride,
  venueId,
  isCanceled = false,
  venues,
  venuesLoading = false,
  defaultVenueName,
  onStartChange,
  onEndChange,
  onDoorTimeChange,
  onCapacityChange,
  onVenueChange,
  onCancelToggle,
  onRemove,
  canRemove = true,
}: OccurrenceCardProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fromLocalInput = (val: string) => {
    if (!val || val.trim() === '') return undefined;
    const d = new Date(val);
    // Validate that the date is valid
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
  };

  // Calculate duration
  const duration = startsAt && endsAt
    ? differenceInMinutes(new Date(endsAt), new Date(startsAt))
    : null;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Count advanced options set
  const advancedCount = [doorTime, capacityOverride, venueId].filter(Boolean).length;

  // Format display date
  const displayDate = startsAt ? format(new Date(startsAt), 'MMM dd, yyyy') : 'Not set';
  const displayStart = startsAt ? format(new Date(startsAt), 'h:mm a') : '';
  const displayEnd = endsAt ? format(new Date(endsAt), 'h:mm a') : '';

  // Get venue name
  const selectedVenue = venues.find(v => v.id === venueId);
  const venueName = selectedVenue?.name || defaultVenueName;

  return (
    <div
      className={`rounded-xl border ${
        isCanceled
          ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
          : 'border-border bg-background'
      } transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              Occurrence {index + 1}
            </span>
            {isCanceled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                <AlertCircle className="h-3 w-3" />
                Canceled
              </span>
            )}
            {duration && !isCanceled && (
              <span className="text-xs text-muted-foreground">
                • {formatDuration(duration)}
              </span>
            )}
          </div>

          {startsAt && !isCanceled && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {displayDate}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {displayStart} {displayEnd && `- ${displayEnd}`}
              </div>
              {venueName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {venueName}
                </div>
              )}
            </div>
          )}
        </div>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Fields */}
      <div className={`px-4 pb-4 space-y-3 ${isCanceled ? 'opacity-60' : ''}`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Start date & time</label>
            <Input
              type="datetime-local"
              disabled={isCanceled}
              value={toLocalInput(startsAt)}
              onChange={(e) => onStartChange(fromLocalInput(e.target.value))}
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">End date & time <span className="text-muted-foreground">(optional)</span></label>
            <Input
              type="datetime-local"
              disabled={isCanceled}
              value={toLocalInput(endsAt)}
              onChange={(e) => onEndChange(fromLocalInput(e.target.value))}
              className="text-sm"
            />
          </div>
        </div>

        {/* Validation warnings */}
        {startsAt && endsAt && new Date(endsAt) <= new Date(startsAt) && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            End time should be after start time
          </div>
        )}
      </div>

      {/* Advanced Options Toggle */}
      <div className="border-t border-border px-4 py-2">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            Advanced options
            {advancedCount > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {advancedCount}
              </span>
            )}
          </span>
          {isAdvancedOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Advanced Options Content */}
      {isAdvancedOpen && (
        <div className={`border-t border-border px-4 py-4 space-y-3 bg-muted/30 ${isCanceled ? 'opacity-60' : ''}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Door time
              </label>
              <Input
                type="datetime-local"
                disabled={isCanceled}
                value={toLocalInput(doorTime)}
                onChange={(e) => onDoorTimeChange(fromLocalInput(e.target.value))}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">When doors open (usually 30-60 min before)</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Capacity override
              </label>
              <Input
                type="number"
                min={0}
                disabled={isCanceled}
                placeholder="Leave blank for default"
                value={capacityOverride || ''}
                onChange={(e) => onCapacityChange(e.target.value ? Number(e.target.value) : undefined)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">Override default event capacity</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Venue override
            </label>
            <Select
              value={venueId || ''}
              onChange={(e) => onVenueChange(e.target.value)}
              disabled={venuesLoading || isCanceled}
              className="text-sm"
            >
              <option value="">Use default venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.address?.city ? `(${v.address.city})` : ''}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">Override the default event venue for this occurrence</p>
          </div>

          <div className="pt-2 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCanceled}
                onChange={(e) => onCancelToggle(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm font-medium">Cancel this occurrence</span>
            </label>
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              This occurrence will be marked as canceled and hidden from attendees
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
