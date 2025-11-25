'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ticketsApi, type Ticket } from '@/lib/api/tickets-api';
import { Loader2, Calendar, MapPin, RefreshCw, Ticket as TicketIcon } from 'lucide-react';
import { QRCode } from '@/components/common/qr-code';
import toast from 'react-hot-toast';

type TabKey = 'upcoming' | 'past';

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
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

  const statusBadge = (status: Ticket['status']) => {
    const map: Record<Ticket['status'], { text: string; className: string }> = {
      issued: { text: 'Ready', className: 'bg-emerald-100 text-emerald-800' },
      transferred: { text: 'Transferred', className: 'bg-blue-100 text-blue-800' },
      refunded: { text: 'Refunded', className: 'bg-amber-100 text-amber-800' },
      checked_in: { text: 'Checked in', className: 'bg-indigo-100 text-indigo-800' },
      void: { text: 'Voided', className: 'bg-slate-200 text-slate-700' },
    };
    const entry = map[status] || { text: status.replace('_', ' '), className: 'bg-slate-200 text-slate-700' };
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${entry.className}`}>
        <span className="h-2 w-2 rounded-full bg-current opacity-70" />
        {entry.text}
      </span>
    );
  };

  const heroCopy = useMemo(
    () =>
      activeTab === 'upcoming'
        ? 'Your ready-to-scan tickets for upcoming events.'
        : 'Past tickets and check-ins for your records.',
    [activeTab],
  );

  return (
    <div className="bg-muted/40 py-10">
      <div className="container mx-auto px-4">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-8 text-white md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                <TicketIcon className="h-4 w-4" />
                My Tickets
              </div>
              <h1 className="text-3xl font-semibold">All your tickets, in one place</h1>
              <p className="text-sm text-slate-200">{heroCopy}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTickets}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-muted/60 p-1">
                <TabButton label="Upcoming" isActive={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} />
                <TabButton label="Past" isActive={activeTab === 'past'} onClick={() => setActiveTab('past')} />
              </div>
              <p className="text-xs text-muted-foreground">
                {tickets.length} {activeTab === 'upcoming' ? 'upcoming' : 'past'} ticket{tickets.length === 1 ? '' : 's'}
              </p>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading tickets...</span>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!loading && !error && tickets.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/40 px-6 py-12 text-center text-muted-foreground">
                <TicketIcon className="h-8 w-8" />
                <div className="text-sm">
                  No {activeTab} tickets found. {activeTab === 'upcoming' ? 'Browse events to book your next experience.' : 'Completed events will show here.'}
                </div>
                <Link
                  href="/events"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Browse events
                </Link>
              </div>
            )}

            {!loading && !error && tickets.length > 0 && (
              <div className="grid gap-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold text-foreground">
                              {ticket.event?.title || 'Event'}
                            </h3>
                            {statusBadge(ticket.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1">
                              <Calendar className="h-4 w-4" />
                              {ticket.event?.startAt ? formatDate(ticket.event.startAt) : 'Date TBA'}
                            </span>
                            {ticket.event?.venue?.name && (
                              <span className="inline-flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1">
                                <MapPin className="h-4 w-4" />
                                {ticket.event.venue.name}
                                {ticket.event.venue.address
                                  ? ` • ${ticket.event.venue.address.city}, ${ticket.event.venue.address.region}`
                                  : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-foreground">
                              {ticket.ticketType?.name || 'General Admission'}
                            </span>
                            {ticket.seat && (
                              <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1">
                                Seat • Section {ticket.seat.section}, Row {ticket.seat.row}, Seat {ticket.seat.number}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1">
                              ID #{ticket.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl border border-border bg-muted/40 p-2 shadow-sm">
                            <QRCode value={ticket.qrCode} size={80} className="p-2" />
                          </div>
                        </div>
                      </div>

                      {selectedTicket === ticket.id ? (
                        <div className="mt-4 rounded-xl border border-border/70 bg-muted/50 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Transfer ticket</h4>
                            <button
                              onClick={() => {
                                setSelectedTicket(null);
                                setTransferEmail('');
                              }}
                              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                          <input
                            type="email"
                            value={transferEmail}
                            onChange={(e) => setTransferEmail(e.target.value)}
                            placeholder="Recipient email"
                            className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTransfer(ticket.id)}
                              disabled={transferring}
                              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                            >
                              {transferring ? 'Sending...' : 'Send transfer'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTicket(null);
                                setTransferEmail('');
                              }}
                              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/account/tickets/${ticket.id}`}
                            className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 md:flex-none"
                          >
                            View ticket
                          </Link>
                          {ticket.status === 'issued' && (
                            <button
                              onClick={() => setSelectedTicket(ticket.id)}
                              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                            >
                              Transfer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type TabButtonProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
