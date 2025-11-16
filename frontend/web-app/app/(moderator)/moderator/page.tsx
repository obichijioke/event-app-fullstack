import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Moderator Dashboard',
  description: 'Content moderation and platform oversight',
};

export default function ModeratorDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Moderator Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg p-6 shadow-card">
          <p className="text-sm text-muted-foreground mb-1">Pending Reviews</p>
          <p className="text-3xl font-bold">0</p>
          <Link href="/moderator/events" className="text-xs text-primary hover:underline mt-2 inline-block">
            View Events →
          </Link>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-card">
          <p className="text-sm text-muted-foreground mb-1">Active Flags</p>
          <p className="text-3xl font-bold text-warning">0</p>
          <Link href="/moderator/flags" className="text-xs text-primary hover:underline mt-2 inline-block">
            View Flags →
          </Link>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-card">
          <p className="text-sm text-muted-foreground mb-1">Events Reviewed Today</p>
          <p className="text-3xl font-bold text-success">0</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-card">
          <p className="text-sm text-muted-foreground mb-1">Flags Resolved Today</p>
          <p className="text-3xl font-bold text-success">0</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Event Reviews */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pending Event Reviews</h2>
              <Link href="/moderator/events" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No pending reviews</p>
              {/* TODO: Map through pending events */}
            </div>
          </div>

          {/* Recent Flags */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Flags</h2>
              <Link href="/moderator/flags" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No recent flags</p>
              {/* TODO: Map through recent flags */}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No recent activity</p>
              {/* TODO: Map through moderation actions */}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/moderator/events"
                className="block px-4 py-2 rounded-md hover:bg-muted transition text-sm"
              >
                Review Events
              </Link>
              <Link
                href="/moderator/flags"
                className="block px-4 py-2 rounded-md hover:bg-muted transition text-sm"
              >
                Manage Flags
              </Link>
              <Link
                href="/moderator/organizations"
                className="block px-4 py-2 rounded-md hover:bg-muted transition text-sm"
              >
                Review Organizations
              </Link>
              <Link
                href="/moderator/users"
                className="block px-4 py-2 rounded-md hover:bg-muted transition text-sm"
              >
                Manage Users
              </Link>
            </div>
          </div>

          {/* Moderation Stats */}
          <div className="bg-card rounded-lg shadow-card p-6">
            <h2 className="text-lg font-semibold mb-4">This Week</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Events Approved</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Events Rejected</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Flags Resolved</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Users Warned</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-primary/10 border border-primary rounded-lg p-6">
            <h3 className="font-semibold mb-2">Moderation Guidelines</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Review our content moderation policies
            </p>
            <a href="#" className="text-sm text-primary hover:underline">
              View Guidelines →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

