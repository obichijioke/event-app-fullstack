import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Order History',
  description: 'View all your orders',
};

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Order History</h1>

      {/* Filters */}
      <div className="bg-card rounded-lg p-4 shadow-card mb-6">
        <div className="flex gap-4 flex-wrap">
          <select className="px-4 py-2 rounded-md border border-border bg-background text-sm">
            <option>All Orders</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>
          <input
            type="date"
            className="px-4 py-2 rounded-md border border-border bg-background text-sm"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {/* TODO: Map through orders */}
        <div className="bg-card rounded-lg p-6 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold">Event Name</h3>
              <p className="text-sm text-muted-foreground">Order #12345 • Jan 15, 2025</p>
            </div>
            <span className="px-3 py-1 bg-success/10 text-success text-xs rounded-full">
              Completed
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium">₦10,000.00</p>
            <Link
              href="/orders/12345"
              className="text-sm text-primary hover:underline"
            >
              View Details
            </Link>
          </div>
        </div>

        <p className="text-center text-muted-foreground py-8">
          No orders found
        </p>
      </div>
    </div>
  );
}

