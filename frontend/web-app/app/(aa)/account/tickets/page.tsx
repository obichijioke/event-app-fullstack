'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ticketsApi, type Ticket } from '@/lib/api/tickets-api';
import { Loader2, Calendar, MapPin, RefreshCw, Ticket as TicketIcon, CreditCard, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { QRCode } from '@/components/common/qr-code';
import toast from 'react-hot-toast';

type TabKey = 'upcoming' | 'past';

type GroupedTickets = {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  venue?: string;
  venueCity?: string;
  venueRegion?: string;
  tickets: Ticket[];
};

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

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

  // Group tickets by event only
  const groupedTickets = useMemo(() => {
    const groups: GroupedTickets[] = [];
    const eventMap = new Map<string, GroupedTickets>();

    tickets.forEach((ticket) => {
      const eventId = ticket.eventId;

      // Get or create event group
      let eventGroup = eventMap.get(eventId);
      if (!eventGroup) {
        eventGroup = {
          eventId,
          eventTitle: ticket.event?.title || 'Untitled Event',
          eventDate: ticket.event?.startAt || '',
          venue: ticket.event?.venue?.name,
          venueCity: ticket.event?.venue?.address?.city,
          venueRegion: ticket.event?.venue?.address?.region,
          tickets: [],
        };
        eventMap.set(eventId, eventGroup);
        groups.push(eventGroup);
      }

      eventGroup.tickets.push(ticket);
    });

    return groups;
  }, [tickets]);

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur mb-2">
            <TicketIcon className="h-4 w-4" />
            My Tickets
          </div>
          <h1 className="text-3xl font-semibold">All your tickets, in one place</h1>
          <p className="text-sm text-slate-200 mt-1">{heroCopy}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="bg-card rounded-xl border border-border/70 p-12 text-center">
            <TicketIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No {activeTab} tickets</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {activeTab === 'upcoming' ? 'Browse events to book your next experience.' : 'Completed events will show here.'}
            </p>
            <Link
              href="/events"
              className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              Browse events
            </Link>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="space-y-8">
                {groupedTickets.map((eventGroup) => {
                  const isEventExpanded = expandedEvents.has(eventGroup.eventId);
                  const totalTickets = eventGroup.tickets.length;
                  const shouldUseCarousel = totalTickets > 4;

                  return (
                    <div key={eventGroup.eventId} className="space-y-4">
                      {/* Event Header */}
                      <button
                        onClick={() => toggleEvent(eventGroup.eventId)}
                        className="w-full rounded-xl border border-border/70 bg-card overflow-hidden text-left transition hover:border-primary/50 group"
                      >
                        <div className="bg-muted/30 border-b border-border/50 px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition">
                                  {eventGroup.eventTitle}
                                </h3>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                                  <TicketIcon className="h-3 w-3" />
                                  {totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {eventGroup.eventDate && (
                                  <span className="inline-flex items-center gap-1.5 font-medium bg-background rounded-md px-2 py-1 border border-border/50">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(eventGroup.eventDate)}
                                  </span>
                                )}
                                {eventGroup.venue && (
                                  <span className="inline-flex items-center gap-1.5 bg-background rounded-md px-2 py-1 border border-border/50">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {eventGroup.venue}
                                    {eventGroup.venueCity && (
                                      <span className="text-muted-foreground/70">
                                        • {eventGroup.venueCity}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                                {isEventExpanded ? 'Collapse' : 'Expand'}
                              </span>
                              {isEventExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition" />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Tickets Grid/Carousel */}
                      {isEventExpanded && (
                        <div className="relative">
                          {shouldUseCarousel && (
                            <>
                              <button
                                onClick={() => {
                                  const container = document.getElementById(`carousel-${eventGroup.eventId}`);
                                  if (container) {
                                    container.scrollBy({ left: -300, behavior: 'smooth' });
                                  }
                                }}
                                className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-lg transition hover:bg-muted xl:block"
                                aria-label="Scroll left"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  const container = document.getElementById(`carousel-${eventGroup.eventId}`);
                                  if (container) {
                                    container.scrollBy({ left: 300, behavior: 'smooth' });
                                  }
                                }}
                                className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-lg transition hover:bg-muted xl:block"
                                aria-label="Scroll right"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          <div
                            id={`carousel-${eventGroup.eventId}`}
                            className={
                              shouldUseCarousel
                                ? 'hide-scrollbar flex gap-4 overflow-x-auto pb-4 xl:overflow-x-scroll xl:px-12'
                                : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                            }
                          >
                            {eventGroup.tickets.map((ticket) => (
                              <div
                                key={ticket.id}
                                className={`group relative overflow-hidden rounded-xl border border-border/70 bg-card transition hover:border-primary/50 hover:shadow-lg ${
                                  shouldUseCarousel ? 'min-w-[300px] flex-shrink-0' : ''
                                }`}
                              >
                                {/* Decorative accent bar */}
                                <div className="h-2 w-full bg-linear-to-r from-primary via-purple-500 to-blue-500" />

                                {/* Ticket Card Content */}
                                <div className="p-4">
                                  {/* Header with Status */}
                                  <div className="mb-3 flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <h4 className="mb-1.5 text-sm font-semibold text-foreground">
                                        {ticket.ticketType?.name || 'General Admission'}
                                      </h4>
                                      {statusBadge(ticket.status)}
                                    </div>
                                  </div>

                                  {/* Event Date & Time */}
                                  {ticket.event?.startAt && (
                                    <div className="mb-3 rounded-lg bg-muted/30 border border-border/50 px-3 py-2 flex items-center gap-3">
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                        <span className="font-semibold text-foreground">
                                          {new Date(ticket.event.startAt).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                          })}
                                        </span>
                                      </div>
                                      <span className="text-muted-foreground">•</span>
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                        <span className="font-semibold text-foreground">
                                          {new Date(ticket.event.startAt).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* QR Code */}
                                  <div className="mb-3 flex justify-center rounded-xl border-2 border-border/50 bg-white p-4 dark:bg-slate-900">
                                    <QRCode value={ticket.qrCode} size={120} />
                                  </div>

                                  {/* Ticket Details */}
                                  <div className="mb-3 space-y-2.5">
                                    {/* Seat Information */}
                                    {ticket.seat && (
                                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                                        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                                          Reserved Seating
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary">
                                            Sec {ticket.seat.section}
                                          </span>
                                          <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary">
                                            Row {ticket.seat.row}
                                          </span>
                                          <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary">
                                            Seat {ticket.seat.number}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Ticket & Order Info */}
                                    <div className="space-y-2 rounded-lg bg-muted/30 border border-border/50 p-3 text-[11px]">
                                      <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                          <TicketIcon className="h-3 w-3" />
                                          Ticket ID
                                        </span>
                                        <span className="font-mono font-semibold text-foreground">
                                          {ticket.id.slice(0, 8).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                          <CreditCard className="h-3 w-3" />
                                          Order ID
                                        </span>
                                        <span className="font-mono font-semibold text-foreground">
                                          {ticket.orderId.slice(0, 8).toUpperCase()}
                                        </span>
                                      </div>
                                      {ticket.issuedAt && (
                                        <div className="flex items-center justify-between">
                                          <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            Issued
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {new Date(ticket.issuedAt).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric',
                                            })}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Transfer UI */}
                                  {selectedTicket === ticket.id ? (
                                    <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-bold">Transfer Ticket</h5>
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
                                        placeholder="Recipient email address"
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                                      />
                                      <button
                                        onClick={() => handleTransfer(ticket.id)}
                                        disabled={transferring}
                                        className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                                      >
                                        {transferring ? 'Sending...' : 'Send Transfer'}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <Link
                                        href={`/account/tickets/${ticket.id}`}
                                        className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-center text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                                      >
                                        View Details
                                      </Link>
                                      {ticket.status === 'issued' && (
                                        <button
                                          onClick={() => setSelectedTicket(ticket.id)}
                                          className="rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted"
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
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        )}
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
