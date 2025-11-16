import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Session Monitoring',
  description: 'Monitor active sessions',
};

export default function SessionMonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Session Monitoring</h1>
          <p className="text-muted-foreground mt-1">Monitor active sessions</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-card p-6">
        <p className="text-muted-foreground">Content for Session Monitoring will be implemented here.</p>
        {/* TODO: Implement Session Monitoring functionality */}
      </div>
    </div>
  );
}
