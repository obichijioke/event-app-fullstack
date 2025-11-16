import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Event Moderation',
  description: 'Review and moderate events',
};

export default function ModeratorEventsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Event Moderation</h1>
          <p className="text-muted-foreground mt-1">Review and approve events</p>
        </div>
        <Link
          href="/moderator"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-card p-6 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option>All Statuses</option>
              <option>Pending Review</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Flagged</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option>All Categories</option>
              <option>Music</option>
              <option>Sports</option>
              <option>Arts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <select className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Search events..."
              className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-success">0</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-error">0</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-warning">0</p>
          <p className="text-xs text-muted-foreground">Flagged</p>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-card rounded-lg shadow-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Events Requiring Review</h2>
        </div>
        <div className="divide-y divide-border">
          {/* TODO: Map through events */}
          <div className="p-6 text-center text-muted-foreground">
            No events requiring review
          </div>
          
          {/* Example Event Row */}
          {/* <div className="p-6 hover:bg-muted/50 transition">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg"></div>
                <div>
                  <h3 className="font-semibold mb-1">Event Title</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    By Organizer Name • Category
                  </p>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-warning/10 text-warning rounded">
                      Pending Review
                    </span>
                    <span className="text-muted-foreground">
                      Submitted 2 hours ago
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/moderator/events/[eventId]/review"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
                >
                  Review
                </Link>
              </div>
            </div>
          </div> */}
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing 0 of 0 events</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-md border border-border hover:bg-muted transition text-sm" disabled>
              Previous
            </button>
            <button className="px-3 py-1 rounded-md border border-border hover:bg-muted transition text-sm" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

