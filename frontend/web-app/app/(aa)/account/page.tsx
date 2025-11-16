import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your account and view your activity',
};

export default function AccountDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Account</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg p-6 shadow-card">
          <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-card">
          <p className="text-sm text-muted-foreground mb-1">Active Tickets</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-card">
          <p className="text-sm text-muted-foreground mb-1">Following</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-card">
          <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
          <p className="text-3xl font-bold">₦0</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Events */}
          <section className="bg-card rounded-lg p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Upcoming Events</h2>
              <Link href="/account/tickets" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {/* TODO: Map through upcoming tickets */}
              <p className="text-muted-foreground text-sm">No upcoming events</p>
            </div>
          </section>

          {/* Recent Orders */}
          <section className="bg-card rounded-lg p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Orders</h2>
              <Link href="/account/orders" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {/* TODO: Map through recent orders */}
              <p className="text-muted-foreground text-sm">No recent orders</p>
            </div>
          </section>
        </div>

        {/* Sidebar - Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-lg p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/account/profile"
                className="block px-4 py-2 rounded-md hover:bg-muted transition text-sm"
              >
                Edit Profile
              </Link>
              <Link
                href="/account/orders"
                className="block px-4 py-2 rounded-md hover:bg-muted transition text-sm"
              >
                View Orders
              </Link>
              <Link
                href="/account/tickets"
                className="block px-4 py-2 rounded-md hover:bg-muted transition text-sm"
              >
                My Tickets
              </Link>
              <Link
                href="/account/security"
                className="block px-4 py-2 rounded-md hover:bg-muted transition text-sm"
              >
                Security Settings
              </Link>
            </div>
          </div>

          {/* Following */}
          <div className="bg-card rounded-lg p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Following</h2>
              <Link href="/account/following" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">Not following any organizers yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}

