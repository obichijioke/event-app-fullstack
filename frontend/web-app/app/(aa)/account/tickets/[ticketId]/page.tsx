'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ticketsApi, type Ticket } from '@/lib/api/tickets-api';
import { QRCode } from '@/components/common/qr-code';
import {
  ArrowLeft,
  Calendar,
  Copy,
  Loader2,
  MapPin,
  Printer,
  Share2,
  Ticket as TicketIcon,
} from 'lucide-react';
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

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (value: string, label: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const handlePrint = () => {
    window.print();
  };

  const statusBadge = useMemo(() => {
    if (!ticket) return null;
    const statusMap: Record<string, { label: string; color: string }> = {
      issued: { label: 'Ready to use', color: 'bg-emerald-100 text-emerald-800' },
      transferred: { label: 'Transferred', color: 'bg-blue-100 text-blue-800' },
      refunded: { label: 'Refunded', color: 'bg-amber-100 text-amber-800' },
      checked_in: { label: 'Checked in', color: 'bg-indigo-100 text-indigo-800' },
      void: { label: 'Voided', color: 'bg-gray-200 text-gray-700' },
    };
    const status = statusMap[ticket.status] || { label: ticket.status, color: 'bg-slate-200 text-slate-700' };
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
        <span className="h-2 w-2 rounded-full bg-current opacity-70" />
        {status.label}
      </span>
    );
  }, [ticket]);

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
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <h2 className="mb-2 text-xl font-semibold">Ticket Not Found</h2>
            <p className="mb-4 text-muted-foreground">
              {error || 'This ticket does not exist or you do not have access to it.'}
            </p>
            <Link
              href="/account/tickets"
              className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
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
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link
                href="/account/tickets"
                className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to tickets
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(ticket.orderId, 'Order ID')}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Copy className="h-4 w-4" />
                Copy order ID
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>

          <div className="ticket-card-print overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white">
              <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.15),transparent_25%)]" />
              <div className="relative flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                    <TicketIcon className="h-4 w-4" />
                    Order {ticket.orderId.slice(0, 8)}
                  </div>
                  <h1 className="text-2xl font-semibold md:text-3xl">
                    {ticket.event?.title || 'Event'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(ticket.event?.startAt || ticket.issuedAt)}
                    </span>
                    {ticket.event?.venue?.name && (
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {ticket.event.venue.name}
                        {ticket.event.venue.address
                          ? ` • ${ticket.event.venue.address.city}, ${ticket.event.venue.address.region}`
                          : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 text-right">
                  {statusBadge}
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                    {ticket.ticketType?.name || 'General Admission'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr]">
              <div className="space-y-4">
                <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/40 p-4 sm:grid-cols-2">
                  <Field label="Ticket ID" value={ticket.id} onCopy={() => copyToClipboard(ticket.id, 'Ticket ID')} />
                  <Field label="Order ID" value={ticket.orderId} onCopy={() => copyToClipboard(ticket.orderId, 'Order ID')} />
                  <Field label="Issued" value={formatShortDate(ticket.issuedAt)} />
                  <Field label="Last updated" value={formatShortDate(ticket.updatedAt)} />
                  <Field label="Status" value={ticket.status.replace('_', ' ')} />
                  {ticket.ticketType?.kind && <Field label="Type" value={ticket.ticketType.kind} />}
                  {ticket.seat && (
                    <Field
                      label="Seat"
                      value={`Section ${ticket.seat.section}, Row ${ticket.seat.row}, Seat ${ticket.seat.number}`}
                    />
                  )}
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Event details</p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.event?.venue?.name || 'Venue'}{' '}
                        {ticket.event?.venue?.address
                          ? ` • ${ticket.event.venue.address.city}, ${ticket.event.venue.address.region}`
                          : ''}
                      </p>
                    </div>
                    {ticket.event?.id && (
                      <Link
                        href={`/events/${ticket.event.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View event
                      </Link>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    Starts at {formatDate(ticket.event?.startAt || ticket.issuedAt)}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Need help?</p>
                      <p className="text-sm text-muted-foreground">
                        Having trouble with this ticket? Reach out to the organizer.
                      </p>
                    </div>
                    <Link href="/support" className="text-sm font-semibold text-primary hover:underline">
                      Contact support
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <div className="text-sm font-semibold text-muted-foreground">Scan at entry</div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <QRCode value={ticket.qrCode} size={200} />
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    <div className="font-semibold text-foreground">Barcode</div>
                    <div className="mt-1 break-all">{ticket.barcode}</div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                    <button
                      onClick={() => copyToClipboard(ticket.barcode, 'Barcode')}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                    <button className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 hover:bg-muted">
                      <Share2 className="h-3 w-3" />
                      Share
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-4 text-sm">
                  <p className="font-semibold">Ticket policies</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• Keep this QR code safe. Do not share publicly.</li>
                    <li>• Transfers may be restricted close to the event start time.</li>
                    <li>• Contact the organizer for refunds or name changes.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

type FieldProps = {
  label: string;
  value: string | number;
  onCopy?: () => void;
};

function Field({ label, value, onCopy }: FieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <p className="break-all text-sm font-semibold">{value || '—'}</p>
        {onCopy && (
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
          >
            <Copy className="h-3 w-3" />
            Copy
          </button>
        )}
      </div>
    </div>
  );
}
