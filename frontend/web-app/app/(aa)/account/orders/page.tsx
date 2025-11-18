import { Metadata } from 'next';
import Link from 'next/link';
import { CurrencyDisplay } from '@/components/common/currency-display';

export const metadata: Metadata = {
  title: 'Order History',
  description: 'View all your orders',
};

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Order History</h1>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-card p-4 shadow-card">
        <div className="flex flex-wrap gap-4">
          <select className="rounded-md border border-border bg-background px-4 py-2 text-sm">
            <option>All Orders</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Cancelled</option>
          </select>
          <input
            type="date"
            className="rounded-md border border-border bg-background px-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {/* TODO: Map through orders */}
        <div className="rounded-lg bg-card p-6 shadow-card">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Event Name</h3>
              <p className="text-sm text-muted-foreground">Order #12345 • Jan 15, 2025</p>
            </div>
            <span className="rounded-full bg-success/10 px-3 py-1 text-xs text-success">
              Completed
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-medium">
              <CurrencyDisplay amountCents={1000000} />
            </p>
            <Link href="/orders/12345" className="text-sm text-primary hover:underline">
              View Details
            </Link>
          </div>
        </div>

        <p className="py-8 text-center text-muted-foreground">No orders found</p>
      </div>
    </div>
  );
}
