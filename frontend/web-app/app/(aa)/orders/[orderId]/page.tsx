import { Metadata } from 'next';
import Link from 'next/link';
import { CurrencyDisplay } from '@/components/common/currency-display';

type Props = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Order #${orderId}`,
    description: 'View order details',
  };
}

export default async function OrderDetailsPage({ params }: Props) {
  const { orderId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order #{orderId}</h1>
            <p className="text-muted-foreground">Placed on January 15, 2025</p>
          </div>
          <span className="rounded-full bg-success/10 px-4 py-2 text-sm font-medium text-success">
            Completed
          </span>
        </div>

        {/* Order Details */}
        <div className="mb-6 rounded-lg bg-card p-6 shadow-card">
          <h2 className="mb-4 text-xl font-semibold">Event Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-lg font-medium">Event Name</p>
              <p className="text-sm text-muted-foreground">Saturday, February 10, 2025 at 7:00 PM</p>
              <p className="text-sm text-muted-foreground">Venue Name, Lagos, Nigeria</p>
            </div>
          </div>
        </div>

        {/* Tickets */}
        <div className="mb-6 rounded-lg bg-card p-6 shadow-card">
          <h2 className="mb-4 text-xl font-semibold">Tickets</h2>
          <div className="space-y-3">
            {/* TODO: Map through tickets */}
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="font-medium">General Admission</p>
                <p className="text-sm text-muted-foreground">Ticket #ABC123</p>
              </div>
              <Link href="/tickets/ABC123" className="text-sm text-primary hover:underline">
                View Ticket
              </Link>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mb-6 rounded-lg bg-card p-6 shadow-card">
          <h2 className="mb-4 text-xl font-semibold">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <CurrencyDisplay amountCents={1000000} currency="NGN" />
            </div>
            <div className="flex justify-between text-sm">
              <span>Fees</span>
              <CurrencyDisplay amountCents={50000} currency="NGN" />
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <CurrencyDisplay amountCents={75000} currency="NGN" />
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
              <span>Total</span>
              <CurrencyDisplay amountCents={1125000} currency="NGN" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button className="flex-1 rounded-md bg-secondary px-6 py-3 text-secondary-foreground transition hover:opacity-90">
            Download Receipt
          </button>
          <button className="flex-1 rounded-md bg-muted px-6 py-3 text-foreground transition hover:bg-muted/80">
            Request Refund
          </button>
        </div>
      </div>
    </div>
  );
}
