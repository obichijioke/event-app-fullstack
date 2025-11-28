'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { ShoppingCart, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventDetailSummary } from '@/lib/events';
import { formatDate } from '@/lib/utils';

interface TicketSelectorProps {
  tickets: EventDetailSummary['tickets'];
  eventId: string;
  eventTitle: string;
  className?: string;
}

const isTicketOnSale = (ticket: EventDetailSummary['tickets'][0]) => {
  const status = (ticket.status || '').toLowerCase();
  return status === 'on_sale' || status === 'active' || status === 'live';
};

export function TicketSelector({ tickets, eventId, eventTitle, className }: TicketSelectorProps) {
  const router = useRouter();

  const handleCheckout = () => {
    router.push(`/events/${eventId}/checkout`);
  };

  const hasActiveTickets = tickets.some((t) => isTicketOnSale(t));

  if (!hasActiveTickets) {
    return (
      <div className={cn('rounded border border-border bg-card p-8 text-center', className)}>
        <p className="text-lg font-semibold text-foreground mb-2">Tickets Not Available</p>
        <p className="text-sm text-muted-foreground">
          Ticket sales are not currently open for this event.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onGetTicket={handleCheckout} />
        ))}
      </div>
    </div>
  );
}

interface TicketCardProps {
  ticket: EventDetailSummary['tickets'][0];
  onGetTicket: () => void;
}

function TicketCard({ ticket, onGetTicket }: TicketCardProps) {
  const priceCents = Number(ticket.priceCents);
  const feeCents = Number(ticket.feeCents);

  const isAvailable = isTicketOnSale(ticket);
  const holdsCount = ticket._count?.holds || 0;
  const soldCount = ticket._count?.tickets || 0;
  const available =
    ticket.capacity !== null && ticket.capacity !== undefined
      ? Math.max(0, Number(ticket.capacity) - soldCount - holdsCount)
      : null;
  const isSoldOut = available !== null && available <= 0;
  const isUpcoming = ticket.salesStart && new Date(ticket.salesStart) > new Date();
  const isExpired = ticket.salesEnd && new Date(ticket.salesEnd) < new Date();

  const getStatusBadge = () => {
    if (isSoldOut) {
      return (
        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
          Sold Out
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
          Sales Ended
        </span>
      );
    }
    if (isUpcoming) {
      return (
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          Coming Soon
        </span>
      );
    }
    if (available !== null && available < 50 && available > 0) {
      return (
        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
          Limited
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-6 transition-all',
        isAvailable && !isSoldOut && !isExpired && !isUpcoming
          ? 'border-border bg-card hover:border-primary/50 hover:shadow-md'
          : 'border-border bg-muted/30 opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-foreground">{ticket.name}</h3>
                {getStatusBadge()}
              </div>

              {ticket.kind === 'SEATED' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Reserved seating
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                ₦{(priceCents / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}
              </p>
              {feeCents > 0 && (
                <p className="text-xs text-muted-foreground">
                  +₦{(feeCents / 100).toLocaleString('en-NG')} fee
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3">
            {available !== null && !isSoldOut && <span>{available} remaining</span>}
            {ticket.salesEnd && !isExpired && (
              <span>Sales end: {formatDate(ticket.salesEnd, 'short')}</span>
            )}
          </div>
        </div>
      </div>

      {isAvailable && !isSoldOut && !isExpired && !isUpcoming && (
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Fees included: ₦{(feeCents / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}
          </div>
          <Button size="sm" onClick={onGetTicket} className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Get Ticket
          </Button>
        </div>
      )}
    </div>
  );
}
