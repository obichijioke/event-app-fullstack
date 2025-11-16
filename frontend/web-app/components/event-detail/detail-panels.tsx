import { Text, Heading, Badge } from '@/components/ui';
import type { EventDetailSummary } from '@/lib/events';
import type { EventSummary } from '@/lib/homepage';
import { formatDate } from '@/lib/utils';

function getTimezoneAbbr(timezone: string): string {
  const timezoneMap: Record<string, string> = {
    'Africa/Lagos': 'WAT',
    'Africa/Accra': 'GMT',
    'Africa/Nairobi': 'EAT',
    'Africa/Cairo': 'EET',
    'Africa/Johannesburg': 'SAST',
  };
  return timezoneMap[timezone] || timezone;
}

type DetailPanelsProps = {
  summary: EventSummary;
  occurrences: EventDetailSummary['occurrences'];
  policies: EventDetailSummary['policies'];
};

export function DetailPanels({ summary, occurrences, policies }: DetailPanelsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel>
        <Heading as="h3" className="text-xl font-semibold">
          Schedule
        </Heading>
        <div className="mt-4 space-y-4">
          {occurrences.length > 0 ? (
            occurrences.map((occurrence) => (
              <div key={occurrence.id} className="rounded border border-border/70 px-4 py-3">
                <Text className="text-sm font-medium text-foreground">
                  {formatDate(occurrence.startsAt, 'long')}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {formatDate(occurrence.startsAt, 'time')} – {formatDate(occurrence.endsAt, 'time')}
                </Text>
                {occurrence.gateOpenAt && (
                  <Text className="text-xs text-muted-foreground">
                    Gates open at {formatDate(occurrence.gateOpenAt, 'time')}
                  </Text>
                )}
              </div>
            ))
          ) : (
            <Text className="text-sm text-muted-foreground">Schedule will be announced soon.</Text>
          )}
        </div>
      </Panel>

      <Panel>
        <Heading as="h3" className="text-xl font-semibold">
          Venue
        </Heading>
        {summary.venue ? (
          <div className="mt-4 space-y-2">
            <Text className="font-medium text-foreground">{summary.venue.name}</Text>
            <Text className="text-sm text-muted-foreground">
              {[summary.venue.city, summary.venue.region, summary.venue.country].filter(Boolean).join(', ')}
            </Text>
            <div className="space-y-1">
              <Text className="text-xs text-muted-foreground">
                Event starts: {formatDate(summary.startAt, 'time')}
                {summary.venue.timezone && ` ${getTimezoneAbbr(summary.venue.timezone)}`}
              </Text>
              {summary.doorTime && (
                <Text className="text-xs text-muted-foreground">
                  Doors open: {formatDate(summary.doorTime, 'time')}
                  {summary.venue.timezone && ` ${getTimezoneAbbr(summary.venue.timezone)}`}
                </Text>
              )}
              {summary.ageRestriction && (
                <div className="mt-2">
                  <Badge variant="warning" size="sm">
                    {summary.ageRestriction}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Text className="mt-4 text-sm text-muted-foreground">Venue details coming soon.</Text>
        )}
      </Panel>

      <Panel className="lg:col-span-2">
        <Heading as="h3" className="text-xl font-semibold">
          Policies
        </Heading>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded border border-border/70 px-4 py-3">
            <Text className="text-sm font-medium text-foreground">Refund policy</Text>
            <Text className="mt-2 text-sm text-muted-foreground">
              {policies?.refundPolicy ?? 'Refund policy will be shared closer to the event.'}
            </Text>
          </div>
          <div className="rounded border border-border/70 px-4 py-3 space-y-2">
            <Text className="text-sm font-medium text-foreground">Transfers & resale</Text>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" size="sm">
                {policies?.transferAllowed ? 'Transfers allowed' : 'Transfers disabled'}
              </Badge>
              <Badge variant="outline" size="sm">
                {policies?.resaleAllowed ? 'Resale allowed' : 'No resale'}
              </Badge>
            </div>
            {policies?.transferCutoff && (
              <Text className="text-xs text-muted-foreground">
                Transfers close {policies.transferCutoff} before start.
              </Text>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded border border-border bg-card p-6 shadow-card ${className ?? ''}`}>
      {children}
    </section>
  );
}
