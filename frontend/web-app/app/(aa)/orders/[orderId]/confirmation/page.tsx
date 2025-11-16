import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ orderId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `Order Confirmation - ${orderId}`,
    description: 'Your order has been confirmed',
  };
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="bg-success/10 border border-success rounded-lg p-8 text-center mb-8">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-4">
            Your tickets have been sent to your email
          </p>
          <p className="text-sm font-mono bg-background px-4 py-2 rounded inline-block">
            Order #{orderId}
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-lg shadow-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>
          
          {/* Event Info */}
          <div className="mb-6 pb-6 border-b border-border">
            <h3 className="font-medium text-lg mb-2">Event Name</h3>
            <p className="text-sm text-muted-foreground">Date & Time</p>
            <p className="text-sm text-muted-foreground">Venue Name, Location</p>
          </div>

          {/* Tickets */}
          <div className="mb-6 pb-6 border-b border-border">
            <h3 className="font-medium mb-3">Tickets</h3>
            <div className="space-y-2">
              {/* TODO: Map through tickets */}
              <div className="flex justify-between text-sm">
                <span>General Admission × 2</span>
                <span>₦10,000.00</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
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
              <span>Total Paid</span>
              <span>₦11,250.00</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/orders/${orderId}`}
            className="bg-primary text-primary-foreground py-3 rounded-md hover:opacity-90 transition text-center font-medium"
          >
            View Order
          </Link>
          <Link
            href="/account/tickets"
            className="bg-secondary text-secondary-foreground py-3 rounded-md hover:opacity-90 transition text-center font-medium"
          >
            View Tickets
          </Link>
          <button className="bg-muted text-foreground py-3 rounded-md hover:bg-muted/80 transition font-medium">
            Add to Calendar
          </button>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-card rounded-lg p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4">What&apos;s Next?</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-primary">✓</span>
              <span>Check your email for your tickets and order confirmation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">✓</span>
              <span>Download your tickets or add them to your mobile wallet</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">✓</span>
              <span>Bring your ticket (digital or printed) to the event</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">✓</span>
              <span>Arrive early to avoid queues at the entrance</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

