'use client';

import React, { useState, useEffect } from 'react';
import { Select } from '@/components/ui/select';
import { Globe, MapPin } from 'lucide-react';
import { POPULAR_TIMEZONES } from '@/lib/data/timezones';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  autoDetect?: boolean;
  compact?: boolean;
}

export function TimezoneSelector({
  value,
  onChange,
  autoDetect = true,
  compact = false,
}: TimezoneSelectorProps) {
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (autoDetect) {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setDetectedTimezone(detected);

        // Auto-set if value is UTC (default)
        if (value === 'UTC' && detected) {
          onChange(detected);
        }
      } catch (error) {
        console.error('Failed to detect timezone:', error);
      }
    }
  }, [autoDetect, value, onChange]);

  const selectedTz = POPULAR_TIMEZONES.find((tz) => tz.value === value);

  if (compact && !isExpanded) {
    return (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {selectedTz?.label || value}
        </span>
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="text-xs text-primary hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Timezone
        </label>
        {detectedTimezone && detectedTimezone !== value && (
          <button
            type="button"
            onClick={() => onChange(detectedTimezone)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <MapPin className="h-3 w-3" />
            Use detected ({detectedTimezone})
          </button>
        )}
      </div>

      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {POPULAR_TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </Select>

      <p className="text-xs text-muted-foreground">
        All event times will be displayed in this timezone to attendees
      </p>

      {compact && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Done
        </button>
      )}
    </div>
  );
}
