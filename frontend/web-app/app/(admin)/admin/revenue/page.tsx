import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Revenue Analytics',
  description: 'Platform revenue analytics',
};

export default function RevenueAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-muted-foreground mt-1">Platform revenue analytics</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-card p-6">
        <p className="text-muted-foreground">Content for Revenue Analytics will be implemented here.</p>
        {/* TODO: Implement Revenue Analytics functionality */}
      </div>
    </div>
  );
}
