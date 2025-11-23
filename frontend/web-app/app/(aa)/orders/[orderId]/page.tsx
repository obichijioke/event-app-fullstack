'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ordersApi, type Order } from '@/lib/api/orders-api';
import { ticketsApi, type Ticket } from '@/lib/api/tickets-api';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderAndTickets();
  }, [orderId]);

  const fetchOrderAndTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderData = await ordersApi.getOrder(orderId);
      setOrder(orderData);
      
      // Fetch tickets for this order
      const ticketsData = await ticketsApi.getUserTickets({});
      const orderTickets = ticketsData.filter(t => t.orderId === orderId);
      setTickets(orderTickets);
    } catch (err: any) {
      setError(err?.message || 'Failed to load order details');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading order...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || 'This order does not exist or you do not have access to it.'}</p>
            <Link
              href="/account/orders"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.id.substring(0, 8)}</h1>
            <p className="text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        {/* Order Details */}
        <div className="mb-6 rounded-lg bg-card p-6 shadow-card">
          <h2 className="mb-4 text-xl font-semibold">Event Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-lg font-medium">{order.event?.title}</p>
              <p className="text-sm text-muted-foreground">
                {order.event?.startAt ? formatDate(order.event.startAt) : 'Date TBA'}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.event?.venue?.name}
                {order.event?.venue?.address && 
                  `, ${order.event.venue.address.city}, ${order.event.venue.address.country}`}
              </p>
            </div>
          </div>
        </div>

        {/* Tickets */}
        <div className="mb-6 rounded-lg bg-card p-6 shadow-card">
          <h2 className="mb-4 text-xl font-semibold">Tickets ({tickets.length})</h2>
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets available yet</p>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="font-medium">{ticket.ticketType?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Ticket #{ticket.id.substring(0, 8)}
                      {ticket.seat && ` • Seat: ${ticket.seat.section} ${ticket.seat.row}-${ticket.seat.number}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      Status: {ticket.status.replace('_', ' ')}
                    </p>
                  </div>
                  <Link 
                    href={`/account/tickets/${ticket.id}`} 
                    className="text-sm text-primary hover:underline"
                  >
                    View Ticket
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mb-6 rounded-lg bg-card p-6 shadow-card">
          <h2 className="mb-4 text-xl font-semibold">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <CurrencyDisplay amountCents={order.subtotalCents} currency={order.currency} />
            </div>
            {Number(order.feesCents) > 0 && (
              <div className="flex justify-between text-sm">
                <span>Fees</span>
                <CurrencyDisplay amountCents={order.feesCents} currency={order.currency} />
              </div>
            )}
            {Number(order.taxCents) > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <CurrencyDisplay amountCents={order.taxCents} currency={order.currency} />
              </div>
            )}
            {Number(order.discountCents) > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount</span>
                <span>-<CurrencyDisplay amountCents={order.discountCents} currency={order.currency} /></span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
              <span>Total</span>
              <CurrencyDisplay amountCents={order.totalCents} currency={order.currency} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button 
            onClick={() => window.print()}
            className="flex-1 rounded-md bg-secondary px-6 py-3 text-secondary-foreground transition hover:opacity-90"
          >
            Download Receipt
          </button>
          <button 
            disabled
            className="flex-1 rounded-md bg-muted px-6 py-3 text-foreground transition hover:bg-muted/80 opacity-50 cursor-not-allowed"
          >
            Request Refund (Soon)
          </button>
        </div>
      </div>
    </div>
  );
}
