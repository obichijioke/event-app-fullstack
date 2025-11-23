'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ticketsApi, type Ticket } from '@/lib/api/tickets-api';
import { QRCode } from '@/components/common/qr-code';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId as string;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketsApi.getTicket(ticketId);
      setTicket(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load ticket');
      toast.error('Failed to load ticket');
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading ticket...</span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Ticket Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || 'This ticket does not exist or you do not have access to it.'}</p>
            <Link
              href="/account/tickets"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
            >
              Back to Tickets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .ticket-card-print,
          .ticket-card-print * {
            visibility: visible;
          }
          .ticket-card-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.5cm;
          }
        }
      `}</style>
      
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <h1 className="text-3xl font-bold">Ticket Details</h1>
          <Link 
            href="/account/tickets" 
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            ← Back to Tickets
          </Link>
        </div>

        {/* Ticket Card */}
        <div className="ticket-card-print bg-card rounded-lg shadow-card overflow-hidden mb-6 print:shadow-none print:border print:border-black">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground print:bg-none print:text-black print:border-b print:border-black">
            <h2 className="text-2xl font-bold mb-2">{ticket.event?.title}</h2>
            <p className="text-sm opacity-90 print:opacity-100">
              {ticket.event?.startAt ? formatDate(ticket.event.startAt) : 'Date TBA'}
            </p>
          </div>

          {/* QR Code */}
          <div className="p-8 text-center bg-white flex flex-col items-center justify-center">
            <div className="mb-4">
              <QRCode value={ticket.qrCode} size={250} />
            </div>
            <p className="text-sm font-mono text-muted-foreground print:text-black">
              Ticket #{ticket.id.substring(0, 8)}
            </p>
            <p className="text-xs text-muted-foreground mt-2 print:text-black">
              Scan this code at the entrance
            </p>
          </div>

          {/* Ticket Info */}
          <div className="p-6 border-t border-border">
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground print:text-black">Ticket Type</dt>
                <dd className="text-sm font-medium">{ticket.ticketType?.name}</dd>
              </div>
              {ticket.seat && (
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground print:text-black">Seat</dt>
                  <dd className="text-sm font-medium">
                    Section {ticket.seat.section}, Row {ticket.seat.row}, Seat {ticket.seat.number}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground print:text-black">Venue</dt>
                <dd className="text-sm font-medium">
                  {ticket.event?.venue?.name || 'Venue TBA'}
                  {ticket.event?.venue?.address && 
                    `, ${ticket.event.venue.address.city}`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground print:text-black">Order</dt>
                <dd className="text-sm font-medium">
                  #{ticket.orderId.substring(0, 8)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground print:text-black">Status</dt>
                <dd className="text-sm font-medium capitalize">
                  <span
                    className={`${
                      ticket.status === 'issued'
                        ? 'text-success'
                        : ticket.status === 'checked_in'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                    } print:text-black`}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Actions - Hidden when printing */}
        <div className="grid grid-cols-2 gap-4 mb-6 print:hidden">
          <button 
            onClick={handlePrint}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download / Print
          </button>
          <button className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition opacity-50 cursor-not-allowed" disabled>
            Add to Wallet (Soon)
          </button>
        </div>

        {/* Important Info */}
        <div className="mt-8 bg-warning/10 border border-warning rounded-lg p-4 print:border-black print:bg-transparent">
          <h3 className="font-semibold mb-2 text-sm">Important Information</h3>
          <ul className="text-xs space-y-1 text-muted-foreground print:text-black">
            <li>• Present this QR code at the venue entrance</li>
            <li>• Arrive at least 30 minutes before the event starts</li>
            <li>• This ticket is non-refundable</li>
            <li>• Do not share screenshots of this ticket</li>
          </ul>
        </div>
      </div>
    </div>
    </>
  );
}
