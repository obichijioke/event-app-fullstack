import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ticket Transfers',
  description: 'Manage ticket transfers',
};

export default function TransfersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Ticket Transfers</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
          Sent
        </button>
        <button className="px-4 py-2 text-muted-foreground hover:text-foreground">
          Received
        </button>
      </div>

      {/* Transfers List */}
      <div className="space-y-4">
        {/* TODO: Map through transfers */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">Event Name</h3>
              <p className="text-sm text-muted-foreground">Ticket #ABC123</p>
            </div>
            <span className="px-3 py-1 bg-warning/10 text-warning text-xs rounded-full">
              Pending
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Sent to: recipient@example.com</p>
            <p>Date: January 15, 2025</p>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-error text-error-foreground rounded-md hover:opacity-90 transition text-sm">
              Cancel Transfer
            </button>
          </div>
        </div>

        <p className="text-center text-muted-foreground py-8">
          No transfers found
        </p>
      </div>
    </div>
  );
}

