import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refunds',
  description: 'View refund requests and history',
};

export default function RefundsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Refunds</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
          Active Requests
        </button>
        <button className="px-4 py-2 text-muted-foreground hover:text-foreground">
          History
        </button>
      </div>

      {/* Refunds List */}
      <div className="space-y-4">
        {/* TODO: Map through refunds */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold">Event Name</h3>
              <p className="text-sm text-muted-foreground">Order #12345 • 2 tickets</p>
            </div>
            <span className="px-3 py-1 bg-warning/10 text-warning text-xs rounded-full">
              Pending
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Refund Amount</span>
              <span className="font-medium">₦10,000.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested</span>
              <span>January 15, 2025</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reason</span>
              <span>Event cancelled</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Your refund request is being processed. You will receive an email once it&apos;s approved.
            </p>
          </div>
        </div>

        <p className="text-center text-muted-foreground py-8">
          No refund requests found
        </p>
      </div>
    </div>
  );
}
