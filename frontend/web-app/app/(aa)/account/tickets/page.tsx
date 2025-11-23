'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ticketsApi, type Ticket } from '@/lib/api/tickets-api';
import { Loader2 } from 'lucide-react';
import { QRCode } from '@/components/common/qr-code';
import toast from 'react-hot-toast';

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketsApi.getUserTickets({
        upcoming: activeTab === 'upcoming',
      });
      setTickets(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tickets');
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (ticketId: string) => {
    if (!transferEmail.trim()) {
      toast.error('Please enter a recipient email');
      return;
    }

    setTransferring(true);
    try {
      await ticketsApi.initiateTransfer({
        ticketId,
        recipientEmail: transferEmail,
      });
      toast.success('Transfer initiated! The recipient will receive an email.');
      setSelectedTicket(null);
      setTransferEmail('');
      fetchTickets();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initiate transfer');
    } finally {
      setTransferring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Tickets</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'upcoming'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'past'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading tickets...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Tickets Grid */}
      {!loading && !error && (
        <div className="grid gap-6">
          {tickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No {activeTab} tickets found
            </p>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-card rounded-lg shadow-card overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {ticket.event?.title || 'Event'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {ticket.event?.startAt
                          ? formatDate(ticket.event.startAt)
                          : 'Date TBA'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.event?.venue?.name || 'Venue TBA'}
                        {ticket.event?.venue?.address &&
                          `, ${ticket.event.venue.address.city}, ${ticket.event.venue.address.region}`}
                      </p>
                      {ticket.ticketType && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Ticket: {ticket.ticketType.name}
                          {ticket.seat &&
                            ` • Seat: ${ticket.seat.section} ${ticket.seat.row}-${ticket.seat.number}`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Status:{' '}
                        <span
                          className={`${
                            ticket.status === 'issued'
                              ? 'text-success'
                              : ticket.status === 'checked_in'
                                ? 'text-primary'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <QRCode value={ticket.qrCode} size={80} className="p-2" />
                    </div>
                  </div>

                  {selectedTicket === ticket.id ? (
                    <div className="border-t border-border pt-4 mt-4">
                      <h4 className="font-medium mb-2">Transfer Ticket</h4>
                      <input
                        type="email"
                        value={transferEmail}
                        onChange={(e) => setTransferEmail(e.target.value)}
                        placeholder="Recipient email"
                        className="w-full px-3 py-2 border border-border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTransfer(ticket.id)}
                          disabled={transferring}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm disabled:opacity-50"
                        >
                          {transferring ? 'Sending...' : 'Send Transfer'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicket(null);
                            setTransferEmail('');
                          }}
                          className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <Link
                        href={`/account/tickets/${ticket.id}`}
                        className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
                      >
                        View Ticket
                      </Link>
                      {ticket.status === 'issued' && (
                        <button
                          onClick={() => setSelectedTicket(ticket.id)}
                          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
                        >
                          Transfer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
