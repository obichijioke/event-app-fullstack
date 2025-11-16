import Link from 'next/link';
import { TicketIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { EventDetailSummary } from '@/lib/events';

interface TicketPricingCardProps {
  eventId: string;
  tickets: EventDetailSummary['tickets'];
}

export function TicketPricingCard({ eventId, tickets }: TicketPricingCardProps) {
  if (!tickets || tickets.length === 0) {
    return null;
  }

  const sortedTickets = [...tickets].sort(
    (a, b) => Number(a.priceCents) - Number(b.priceCents),
  );

  const cheapestTicket = sortedTickets[0];
  const startingPrice = formatCurrency(
    Number(cheapestTicket.priceCents),
    cheapestTicket.currency
  );

  return (
    <div className="flex items-center justify-between pt-5">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Starting from</p>
        <p className="text-2xl font-bold text-foreground">{startingPrice}</p>
      </div>
      <Link href={`/events/${eventId}/checkout`}>
        <Button size="lg" className="flex items-center gap-2">
          <TicketIcon className="h-5 w-5" />
          Get Tickets
        </Button>
      </Link>
    </div>
  );
}

