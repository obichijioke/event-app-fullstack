import { Metadata } from 'next';
import { CurrencyDisplay } from '@/components/common/currency-display';

export const metadata: Metadata = {
  title: 'Refunds',
  description: 'View refund requests and history',
};

export default function RefundsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Refunds</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-border">
        <button className="border-b-2 border-primary px-4 py-2 text-primary font-medium">
          Active Requests
        </button>
        <button className="px-4 py-2 text-muted-foreground hover:text-foreground">History</button>
      </div>

      {/* Refunds List */}
      <div className="space-y-4">
        {/* TODO: Map through refunds */}
        <div className="rounded-lg bg-card p-6 shadow-card">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Event Name</h3>
              <p className="text-sm text-muted-foreground">Order #12345 • 2 tickets</p>
            </div>
            <span className="rounded-full bg-warning/10 px-3 py-1 text-xs text-warning">
              Pending
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Refund Amount</span>
              <span className="font-medium">
                <CurrencyDisplay amountCents={1000000} currency="NGN" />
              </span>
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
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Your refund request is being processed. You will receive an email once it&apos;s approved.
            </p>
          </div>
        </div>

        <p className="py-8 text-center text-muted-foreground">No refund requests found</p>
      </div>
    </div>
  );
}
