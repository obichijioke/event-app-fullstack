import { Metadata } from 'next';
import Link from 'next/link';

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
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Order #{orderId}</h1>
            <p className="text-muted-foreground">Placed on January 15, 2025</p>
          </div>
          <span className="px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
            Completed
          </span>
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-lg shadow-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Event Details</h2>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-lg">Event Name</p>
              <p className="text-sm text-muted-foreground">Saturday, February 10, 2025 at 7:00 PM</p>
              <p className="text-sm text-muted-foreground">Venue Name, Lagos, Nigeria</p>
            </div>
          </div>
        </div>

        {/* Tickets */}
        <div className="bg-card rounded-lg shadow-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tickets</h2>
          <div className="space-y-3">
            {/* TODO: Map through tickets */}
            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <div>
                <p className="font-medium">General Admission</p>
                <p className="text-sm text-muted-foreground">Ticket #ABC123</p>
              </div>
              <Link
                href="/tickets/ABC123"
                className="text-sm text-primary hover:underline"
              >
                View Ticket
              </Link>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-card rounded-lg shadow-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₦10,000.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Fees</span>
              <span>₦500.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>₦750.00</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span>₦11,250.00</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition">
            Download Receipt
          </button>
          <button className="flex-1 px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition">
            Request Refund
          </button>
        </div>
      </div>
    </div>
  );
}

