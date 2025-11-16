import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Organization Moderation',
  description: 'Manage and moderate organizations',
};

export default function ModeratorOrganizationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Organization Moderation</h1>
          <p className="text-muted-foreground mt-1">Review and manage organizations</p>
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
              <option>Active</option>
              <option>Suspended</option>
              <option>Pending Review</option>
              <option>Flagged</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Verification</label>
            <select className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option>All</option>
              <option>Verified</option>
              <option>Unverified</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option>Recent Activity</option>
              <option>Name</option>
              <option>Events Count</option>
              <option>Flags Count</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Search organizations..."
              className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Total Organizations</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-success">0</p>
          <p className="text-xs text-muted-foreground">Verified</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-warning">0</p>
          <p className="text-xs text-muted-foreground">Pending Review</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-error">0</p>
          <p className="text-xs text-muted-foreground">Flagged</p>
        </div>
      </div>

      {/* Organizations List */}
      <div className="bg-card rounded-lg shadow-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Organizations</h2>
        </div>
        <div className="divide-y divide-border">
          {/* TODO: Map through organizations */}
          <div className="p-6 text-center text-muted-foreground">
            No organizations found
          </div>
          
          {/* Example Organization Row */}
          {/* <div className="p-6 hover:bg-muted/50 transition">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg"></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Organization Name</h3>
                    <span className="px-2 py-0.5 bg-success/10 text-success rounded text-xs">
                      Verified
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    contact@organization.com
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>10 events</span>
                    <span>5 members</span>
                    <span>0 flags</span>
                    <span>Joined 6 months ago</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm">
                  View Details
                </button>
                <button className="px-3 py-1 bg-warning text-warning-foreground rounded-md hover:opacity-90 transition text-sm">
                  Suspend
                </button>
              </div>
            </div>
          </div> */}
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing 0 of 0 organizations</p>
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

