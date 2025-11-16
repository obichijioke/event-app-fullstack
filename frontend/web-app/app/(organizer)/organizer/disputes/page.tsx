import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disputes',
  description: 'Manage payment disputes',
};

export default function DisputesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Disputes</h1>
          <p className="text-muted-foreground mt-1">Manage payment disputes</p>
        </div>
        <Link
          href="/organizer"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-card p-6">
        <p className="text-muted-foreground">Content for Disputes will be implemented here.</p>
        {/* TODO: Implement Disputes functionality */}
      </div>
    </div>
  );
}
