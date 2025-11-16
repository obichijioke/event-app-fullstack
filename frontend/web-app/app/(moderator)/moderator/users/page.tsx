import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'User Moderation',
  description: 'Manage and moderate users',
};

export default function ModeratorUsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Moderation</h1>
          <p className="text-muted-foreground mt-1">Review and manage user accounts</p>
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
              <option>Banned</option>
              <option>Flagged</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option>All Roles</option>
              <option>Attendee</option>
              <option>Organizer</option>
              <option>Moderator</option>
              <option>Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
              <option>Recent Activity</option>
              <option>Name</option>
              <option>Join Date</option>
              <option>Flags Count</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-success">0</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-warning">0</p>
          <p className="text-xs text-muted-foreground">Suspended</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow-card text-center">
          <p className="text-2xl font-bold text-error">0</p>
          <p className="text-xs text-muted-foreground">Flagged</p>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-card rounded-lg shadow-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Users</h2>
        </div>
        <div className="divide-y divide-border">
          {/* TODO: Map through users */}
          <div className="p-6 text-center text-muted-foreground">
            No users found
          </div>
          
          {/* Example User Row */}
          {/* <div className="p-6 hover:bg-muted/50 transition">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">User Name</h3>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                      Attendee
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    user@example.com
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>5 tickets purchased</span>
                    <span>0 flags</span>
                    <span>Joined 3 months ago</span>
                    <span>Last active: 2 days ago</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm">
                  View Profile
                </button>
                <button className="px-3 py-1 bg-warning text-warning-foreground rounded-md hover:opacity-90 transition text-sm">
                  Warn
                </button>
                <button className="px-3 py-1 bg-error text-error-foreground rounded-md hover:opacity-90 transition text-sm">
                  Suspend
                </button>
              </div>
            </div>
          </div> */}
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing 0 of 0 users</p>
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

