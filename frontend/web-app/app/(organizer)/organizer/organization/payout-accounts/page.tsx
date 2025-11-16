import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Payout Accounts',
  description: 'Manage payout accounts',
};

export default function PayoutAccountsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Payout Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage payout accounts</p>
        </div>
        <Link
          href="/organizer"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-card p-6">
        <p className="text-muted-foreground">Content for Payout Accounts will be implemented here.</p>
        {/* TODO: Implement Payout Accounts functionality */}
      </div>
    </div>
  );
}
