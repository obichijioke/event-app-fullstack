import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Review Event - ${eventId}`,
    description: 'Review event for approval',
  };
}

export default async function EventReviewPage({ params }: Props) {
  const { eventId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Event Review</h1>
          <p className="text-muted-foreground mt-1">Event ID: {eventId}</p>
        </div>
        <Link
          href="/moderator/events"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Events
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">Event Information</h2>
            
            {/* Event Image */}
            <div className="w-full h-64 bg-muted rounded-lg mb-4"></div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Event Title</label>
                <p className="text-lg font-semibold">Event Title Placeholder</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p>Music</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                  <p>GA (General Admission)</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1">Event description will be displayed here...</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p>Jan 1, 2025 at 7:00 PM</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <p>Jan 1, 2025 at 11:00 PM</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Venue</label>
                <p>Venue Name</p>
                <p className="text-sm text-muted-foreground">Address details</p>
              </div>
            </div>
          </div>

          {/* Organizer Information */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">Organizer Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization</label>
                <p>Organization Name</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
                <p>organizer@example.com</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Previous Events</label>
                <p>0 events hosted</p>
              </div>
            </div>
          </div>

          {/* Ticket Information */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">Ticket Types</h2>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No ticket types configured</p>
              {/* TODO: Map through ticket types */}
            </div>
          </div>

          {/* Moderation Notes */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">Moderation Notes</h2>
            <textarea
              rows={4}
              placeholder="Add notes about this review..."
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Review Actions */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Review Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-success text-success-foreground rounded-md hover:opacity-90 transition font-medium">
                ✓ Approve Event
              </button>
              <button className="w-full px-4 py-3 bg-error text-error-foreground rounded-md hover:opacity-90 transition font-medium">
                ✗ Reject Event
              </button>
              <button className="w-full px-4 py-3 bg-warning text-warning-foreground rounded-md hover:opacity-90 transition font-medium">
                ⚠ Request Changes
              </button>
              <button className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition">
                Flag for Review
              </button>
            </div>
          </div>

          {/* Review Status */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Status</span>
                <span className="px-2 py-1 bg-warning/10 text-warning rounded text-xs">
                  Pending
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span>2 hours ago</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Flags</span>
                <span>0</span>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Review Checklist</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                <span>Event details are accurate</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                <span>Images are appropriate</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                <span>No prohibited content</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                <span>Pricing is reasonable</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                <span>Venue information verified</span>
              </label>
            </div>
          </div>

          {/* History */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Review History</h2>
            <p className="text-sm text-muted-foreground">No previous reviews</p>
          </div>
        </div>
      </div>
    </div>
  );
}

