'use client';

import { EventOccurrence } from '@/lib/types/organizer';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/format';

interface OccurrenceCardProps {
  occurrence: EventOccurrence;
  onDelete: (occurrence: EventOccurrence) => void;
}

export function OccurrenceCard({ occurrence, onDelete }: OccurrenceCardProps) {
  return (
    <div className="border border-border rounded-lg p-4 hover:border-primary/50 transition bg-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-medium">
              {new Date(occurrence.startsAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Starts:</span>{' '}
                <span className="font-medium">
                  {new Date(occurrence.startsAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Ends:</span>{' '}
                <span className="font-medium">
                  {new Date(occurrence.endsAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {occurrence.gateOpenAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Gates Open:</span>{' '}
                  <span className="font-medium">
                    {new Date(occurrence.gateOpenAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(occurrence)}
          className="p-2 hover:bg-red-50 text-red-600 rounded-md transition"
          title="Delete occurrence"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
