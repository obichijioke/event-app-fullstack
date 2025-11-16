import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'My Tickets',
  description: 'View all your tickets',
};

export default function TicketsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Tickets</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
          Upcoming
        </button>
        <button className="px-4 py-2 text-muted-foreground hover:text-foreground">
          Past
        </button>
      </div>

      {/* Tickets Grid */}
      <div className="grid gap-6">
        {/* TODO: Map through tickets */}
        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Event Name</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Saturday, February 10, 2025 at 7:00 PM
                </p>
                <p className="text-sm text-muted-foreground">
                  Venue Name, Lagos
                </p>
              </div>
              <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
                {/* QR Code */}
                <span className="text-xs text-muted-foreground">QR</span>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-border">
              <Link
                href="/tickets/ABC123"
                className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
              >
                View Ticket
              </Link>
              <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm">
                Transfer
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-muted-foreground py-8">
          No tickets found
        </p>
      </div>
    </div>
  );
}

