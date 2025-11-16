import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ flagId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { flagId } = await params;
  return {
    title: `Flag Details - ${flagId}`,
    description: 'Review flagged content',
  };
}

export default async function FlagDetailsPage({ params }: Props) {
  const { flagId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Flag Details</h1>
          <p className="text-muted-foreground mt-1">Flag ID: {flagId}</p>
        </div>
        <Link
          href="/moderator/flags"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Flags
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Flag Information */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">Flag Information</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-error/10 text-error rounded text-sm font-medium">
                  High Priority
                </span>
                <span className="px-3 py-1 bg-warning/10 text-warning rounded text-sm">
                  Open
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Content Type</label>
                <p>Event</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <p>Inappropriate Content</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">
                  Detailed description of why this content was flagged...
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reported By</label>
                  <p>User Name</p>
                  <p className="text-xs text-muted-foreground">user@example.com</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reported At</label>
                  <p>Jan 1, 2025 at 2:30 PM</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Reports</label>
                <p>3 users have reported this content</p>
              </div>
            </div>
          </div>

          {/* Flagged Content */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">Flagged Content</h2>
            
            {/* Content Preview */}
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
              <h3 className="font-semibold mb-2">Content Title</h3>
              <p className="text-sm text-muted-foreground">
                Content details and description will be displayed here...
              </p>
            </div>

            <div className="mt-4">
              <Link
                href="#"
                className="text-sm text-primary hover:underline"
              >
                View Full Content →
              </Link>
            </div>
          </div>

          {/* Related Reports */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">Related Reports</h2>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No other reports for this content</p>
              {/* TODO: Map through related reports */}
            </div>
          </div>

          {/* Moderator Notes */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">Moderator Notes</h2>
            <textarea
              rows={4}
              placeholder="Add notes about this flag..."
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Actions */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-success text-success-foreground rounded-md hover:opacity-90 transition font-medium">
                ✓ Resolve - Valid
              </button>
              <button className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition">
                Dismiss - Invalid
              </button>
              <button className="w-full px-4 py-3 bg-error text-error-foreground rounded-md hover:opacity-90 transition font-medium">
                Remove Content
              </button>
              <button className="w-full px-4 py-3 bg-warning text-warning-foreground rounded-md hover:opacity-90 transition">
                Warn User
              </button>
              <button className="w-full px-4 py-3 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition">
                Suspend Account
              </button>
            </div>
          </div>

          {/* Content Owner */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Content Owner</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p>Owner Name</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">owner@example.com</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Previous Flags</label>
                <p>0 flags</p>
              </div>
              <Link
                href="#"
                className="text-sm text-primary hover:underline"
              >
                View Profile →
              </Link>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Timeline</h2>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">Flag Created</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Status: Open</p>
                <p className="text-xs text-muted-foreground">Current</p>
              </div>
            </div>
          </div>

          {/* Similar Flags */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Similar Flags</h2>
            <p className="text-sm text-muted-foreground">No similar flags found</p>
          </div>
        </div>
      </div>
    </div>
  );
}

