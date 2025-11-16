import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Flag Management',
  description: 'Manage flagged content',
};

export default function ModeratorFlagsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Flag Management</h1>
          <p className="text-muted-foreground mt-1">Review and resolve flagged content</p>
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
              <option>Open</option>
              <option>Under Review</option>
              <option>Resolved</option>
              <option>Dismissed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content Type</label>
            <select className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option>All Types</option>
              <option>Event</option>
              <option>Organization</option>
              <option>User</option>
              <option>Comment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <select className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option>All Reasons</option>
              <option>Spam</option>
              <option>Inappropriate Content</option>
              <option>Fraud</option>
              <option>Copyright</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option>All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-error">0</p>
          <p className="text-xs text-muted-foreground">Open Flags</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-warning">0</p>
          <p className="text-xs text-muted-foreground">Under Review</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-success">0</p>
          <p className="text-xs text-muted-foreground">Resolved Today</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Total This Week</p>
        </div>
      </div>

      {/* Flags List */}
      <div className="bg-card rounded-lg shadow-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Flagged Content</h2>
        </div>
        <div className="divide-y divide-border">
          {/* TODO: Map through flags */}
          <div className="p-6 text-center text-muted-foreground">
            No flagged content
          </div>
          
          {/* Example Flag Row */}
          {/* <div className="p-6 hover:bg-muted/50 transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-error/10 text-error rounded text-xs font-medium">
                    High Priority
                  </span>
                  <span className="px-2 py-1 bg-warning/10 text-warning rounded text-xs">
                    Open
                  </span>
                  <span className="text-xs text-muted-foreground">Event</span>
                </div>
                <h3 className="font-semibold mb-1">Flagged Content Title</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Reason: Inappropriate Content
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Reported by: User Name</span>
                  <span>2 hours ago</span>
                  <span>3 reports</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/moderator/flags/[flagId]"
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
          <p className="text-sm text-muted-foreground">Showing 0 of 0 flags</p>
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

