import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ ticketId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticketId } = await params;
  return {
    title: `Ticket #${ticketId}`,
    description: 'View ticket details and QR code',
  };
}

export default async function TicketDetailsPage({ params }: Props) {
  const { ticketId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Ticket Details</h1>

        {/* Ticket Card */}
        <div className="bg-card rounded-lg shadow-card overflow-hidden mb-6">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
            <h2 className="text-2xl font-bold mb-2">Event Name</h2>
            <p className="text-sm opacity-90">Saturday, February 10, 2025 at 7:00 PM</p>
          </div>

          {/* QR Code */}
          <div className="p-8 text-center bg-white">
            <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4">
              {/* TODO: QR Code component */}
              <span className="text-muted-foreground">QR Code</span>
            </div>
            <p className="text-sm font-mono text-muted-foreground">Ticket #{ticketId}</p>
          </div>

          {/* Ticket Info */}
          <div className="p-6 border-t border-border">
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Ticket Type</dt>
                <dd className="text-sm font-medium">General Admission</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Seat</dt>
                <dd className="text-sm font-medium">Section A, Row 5, Seat 12</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Venue</dt>
                <dd className="text-sm font-medium">Venue Name, Lagos</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Order</dt>
                <dd className="text-sm font-medium">
                  <Link href="/orders/12345" className="text-primary hover:underline">
                    #12345
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition">
            Download Ticket
          </button>
          <button className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition">
            Add to Wallet
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/tickets/${ticketId}/transfer`}
            className="text-center px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition"
          >
            Transfer Ticket
          </Link>
          <button className="px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition">
            Add to Calendar
          </button>
        </div>

        {/* Important Info */}
        <div className="mt-8 bg-warning/10 border border-warning rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-sm">Important Information</h3>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Present this QR code at the venue entrance</li>
            <li>• Arrive at least 30 minutes before the event starts</li>
            <li>• This ticket is non-refundable</li>
            <li>• Screenshots of this ticket are not valid</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

