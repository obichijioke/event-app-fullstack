import { CalendarIcon } from '@/components/ui/icons';
import { formatDate } from '@/lib/utils';
import { AddToCalendarDropdown } from './add-to-calendar-dropdown';

interface DateTimeCardProps {
  startsAt: string;
  endsAt?: string | null;
  gateOpenAt?: string | null;
  timezone?: string | null;
  eventTitle?: string;
  eventDescription?: string;
  eventLocation?: string;
  eventUrl?: string;
}

function getTimezoneAbbr(timezone?: string | null): string {
  if (!timezone) return 'WAT';
  
  const timezoneMap: Record<string, string> = {
    'Africa/Lagos': 'WAT',
    'Africa/Accra': 'GMT',
    'Africa/Nairobi': 'EAT',
    'Africa/Cairo': 'EET',
    'Africa/Johannesburg': 'SAST',
  };
  return timezoneMap[timezone] || 'WAT';
}

export function DateTimeCard({
  startsAt,
  endsAt,
  gateOpenAt,
  timezone,
  eventTitle = 'Event',
  eventDescription,
  eventLocation,
  eventUrl,
}: DateTimeCardProps) {
  const dateLabel = formatDate(startsAt, 'long');
  const timeLabel = formatDate(startsAt, 'time');
  const timezoneAbbr = getTimezoneAbbr(timezone);

  // Calculate end time (use provided endsAt or default to 3 hours after start)
  const startDate = new Date(startsAt);
  const endDate = endsAt ? new Date(endsAt) : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  // Calculate duration in hours
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationHours = Math.round(durationMs / (1000 * 60 * 60));

  const calendarEventData = {
    title: eventTitle,
    description: eventDescription,
    location: eventLocation,
    startTime: startsAt,
    endTime: endDate.toISOString(),
    url: eventUrl,
  };

  return (
    <div className="flex gap-4 border-b border-border pb-5">
      <div className="flex-shrink-0">
        <CalendarIcon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-foreground mb-2">Date & Time</h3>
        <p className="text-sm text-foreground">{dateLabel}</p>
        <p className="text-sm text-foreground">{timeLabel} {timezoneAbbr}</p>
        {endsAt && durationHours > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Duration: {durationHours} {durationHours === 1 ? 'hour' : 'hours'}
          </p>
        )}
        {gateOpenAt && (
          <p className="text-xs text-muted-foreground mt-1">
            Doors open: {formatDate(gateOpenAt, 'time')} {timezoneAbbr}
          </p>
        )}
        <div className="mt-3">
          <AddToCalendarDropdown eventData={calendarEventData} />
        </div>
      </div>
    </div>
  );
}

