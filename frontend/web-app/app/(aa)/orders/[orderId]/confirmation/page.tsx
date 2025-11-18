import { Metadata } from 'next';
import Link from 'next/link';
import { CurrencyDisplay } from '@/components/common/currency-display';

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
      <div className="mx-auto max-w-3xl">
        {/* Success Message */}
        <div className="mb-8 rounded-lg border border-success bg-success/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold">Order Confirmed!</h1>
          <p className="mb-4 text-muted-foreground">Your tickets have been sent to your email</p>
          <p className="inline-block rounded bg-background px-4 py-2 font-mono text-sm">
            Order #{orderId}
          </p>
        </div>

        {/* Order Details */}
        <div className="mb-6 rounded-lg bg-card p-6 shadow-card">
          <h2 className="mb-4 text-xl font-semibold">Order Details</h2>

          {/* Event Info */}
          <div className="mb-6 border-b border-border pb-6">
            <h3 className="mb-2 text-lg font-medium">Event Name</h3>
            <p className="text-sm text-muted-foreground">Date &amp; Time</p>
            <p className="text-sm text-muted-foreground">Venue Name, Location</p>
          </div>

          {/* Tickets */}
          <div className="mb-6 border-b border-border pb-6">
            <h3 className="mb-3 font-medium">Tickets</h3>
            <div className="space-y-2 text-sm">
              {/* TODO: Map through tickets */}
              <div className="flex justify-between">
                <span>General Admission - 2</span>
                <CurrencyDisplay amountCents={1000000} currency="NGN" />
              </div>
            </div>
          </div>

          {/* Payment Summary */}
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
              <span>Total Paid</span>
              <CurrencyDisplay amountCents={1125000} currency="NGN" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href={`/orders/${orderId}`}
            className="rounded-md bg-primary py-3 text-center font-medium text-primary-foreground transition hover:opacity-90"
          >
            View Order
          </Link>
          <Link
            href="/account/tickets"
            className="rounded-md bg-secondary py-3 text-center font-medium text-secondary-foreground transition hover:opacity-90"
          >
            View Tickets
          </Link>
          <button className="rounded-md bg-muted py-3 font-medium text-foreground transition hover:bg-muted/80">
            Add to Calendar
          </button>
        </div>

        {/* Next Steps */}
        <div className="mt-8 rounded-lg bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">What&apos;s Next?</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-primary">•</span>
              <span>Check your email for your tickets and order confirmation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">•</span>
              <span>Download your tickets or add them to your mobile wallet</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">•</span>
              <span>Bring your ticket (digital or printed) to the event</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">•</span>
              <span>Arrive early to avoid queues at the entrance</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
