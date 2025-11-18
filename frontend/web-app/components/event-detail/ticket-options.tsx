import Link from 'next/link';
import { Badge, Text, buttonVariants } from '@/components/ui';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { cn } from '@/lib/utils';
import type { EventDetailSummary } from '@/lib/events';

type TicketOptionsProps = {
  eventId: string;
  tickets: EventDetailSummary['tickets'];
};

export function TicketOptions({ eventId, tickets }: TicketOptionsProps) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <Text className="text-base text-muted-foreground">
          Tickets are not available yet. Check back soon or follow the organizer for updates.
        </Text>
      </div>
    );
  }

  const sortedTickets = [...tickets].sort(
    (a, b) => Number(a.priceCents) - Number(b.priceCents),
  );

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Tickets</h2>
        <Badge variant="outline" size="sm">
          {sortedTickets.length} option{sortedTickets.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-3">
        {sortedTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="rounded-xl border border-border/70 bg-muted/10 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{ticket.name}</p>
                <Text className="text-xs text-muted-foreground">
                  <CurrencyDisplay
                    amountCents={Number(ticket.priceCents)}
                    currency={ticket.currency}
                  />{' '}
                  {ticket.capacity ? `• ${ticket.capacity} available` : ''}
                </Text>
              </div>
              <Link
                href={`/events/${eventId}/checkout`}
                className={cn(buttonVariants({ size: 'sm' }))}
              >
                Select
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Text className="text-xs text-muted-foreground">
        Prices include applicable fees and taxes. Availability may change based on demand.
      </Text>
    </div>
  );
}
