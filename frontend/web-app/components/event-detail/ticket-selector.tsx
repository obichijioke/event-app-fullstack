'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Minus, Plus, ShoppingCart, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventDetailSummary } from '@/lib/events';
import { formatDate } from '@/lib/utils';

interface TicketSelectorProps {
  tickets: EventDetailSummary['tickets'];
  eventId: string;
  eventTitle: string;
  className?: string;
}

interface TicketQuantity {
  [ticketId: string]: number;
}

export function TicketSelector({ tickets, eventId, eventTitle, className }: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<TicketQuantity>({});

  const updateQuantity = (ticketId: string, delta: number, max: number = 10) => {
    setQuantities((prev) => {
      const current = prev[ticketId] || 0;
      const newQuantity = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [ticketId]: newQuantity };
    });
  };

  const totalQuantity = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = tickets.reduce((sum, ticket) => {
    const qty = quantities[ticket.id] || 0;
    return sum + qty * (Number(ticket.priceCents) + Number(ticket.feeCents));
  }, 0);

  const handleCheckout = () => {
    // Navigate to checkout page with selected tickets
    const selectedTickets = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ id, quantity: qty }));

    if (selectedTickets.length === 0) {
      return;
    }

    // TODO: Navigate to checkout
    console.log('Checkout:', { eventId, tickets: selectedTickets });
  };

  const hasActiveTickets = tickets.some((t) => t.status === 'on_sale');

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
      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            quantity={quantities[ticket.id] || 0}
            onUpdateQuantity={(delta) => updateQuantity(ticket.id, delta, 10)}
          />
        ))}
      </div>

      {/* Checkout Summary */}
      {totalQuantity > 0 && (
        <div className="sticky bottom-0 bg-card border border-border rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {totalQuantity} ticket{totalQuantity !== 1 ? 's' : ''} selected
              </p>
              <p className="text-2xl font-bold text-foreground">
                ₦{(totalPrice / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Including fees</p>
            </div>
            <Button size="lg" onClick={handleCheckout} className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TicketCardProps {
  ticket: EventDetailSummary['tickets'][0];
  quantity: number;
  onUpdateQuantity: (delta: number) => void;
}

function TicketCard({ ticket, quantity, onUpdateQuantity }: TicketCardProps) {
  const priceCents = Number(ticket.priceCents);
  const feeCents = Number(ticket.feeCents);
  const totalCents = priceCents + feeCents;

  const isAvailable = ticket.status === 'on_sale';
  const isSoldOut = ticket.capacity !== null && (ticket.capacity <= 0);
  const isUpcoming = ticket.salesStart && new Date(ticket.salesStart) > new Date();
  const isExpired = ticket.salesEnd && new Date(ticket.salesEnd) < new Date();

  const getStatusBadge = () => {
    if (isSoldOut) {
      return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Sold Out</span>;
    }
    if (isExpired) {
      return <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">Sales Ended</span>;
    }
    if (isUpcoming) {
      return <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Coming Soon</span>;
    }
    if (ticket.capacity !== null && ticket.capacity < 50) {
      return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">Limited</span>;
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
        {/* Ticket Info */}
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

            {/* Price */}
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

          {/* Additional Info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-3">
            {ticket.capacity !== null && !isSoldOut && (
              <span>{ticket.capacity} remaining</span>
            )}
            {ticket.salesEnd && !isExpired && (
              <span>
                Sales end: {formatDate(ticket.salesEnd, 'short')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quantity Selector */}
      {isAvailable && !isSoldOut && !isExpired && !isUpcoming && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Quantity</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(-1)}
                disabled={quantity === 0}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold text-foreground w-8 text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(1)}
                disabled={quantity >= 10 || (ticket.capacity !== null && quantity >= ticket.capacity)}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {quantity > 0 && (
            <p className="text-sm text-muted-foreground text-right mt-2">
              Subtotal: ₦{((totalCents * quantity) / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
