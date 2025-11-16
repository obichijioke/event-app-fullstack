import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fee Schedules',
  description: 'Understand how platform fees are applied',
};

export default function FeeSchedulesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Fee Schedules</h1>
          <p className="text-muted-foreground mt-1">
            Platform fees are set by our team. You can choose who pays them, but not the rate.
          </p>
        </div>
        <Link
          href="/organizer"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-card p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">How fees work</h2>
          <p className="text-muted-foreground">
            Platform service fees are managed centrally to keep pricing consistent and to ensure payment processing,
            fraud, and support costs are covered. Organizers can decide whether fees are passed to buyers or absorbed,
            but the underlying fee rates are set by the platform.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-1">Buyer vs. Organizer pays</h3>
            <p className="text-sm text-muted-foreground">
              Use the pricing settings in your event checkout configuration to choose whether buyers pay the platform
              fee or you absorb it. This does not change the fee rate, only who is charged.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-1">Need a custom rate?</h3>
            <p className="text-sm text-muted-foreground">
              Custom fee schedules are contract-based. Reach out to our team with expected volume and event categories.
            </p>
            <a
              href="mailto:sales@example.com?subject=Custom%20fee%20schedule%20request"
              className="inline-block mt-3 text-primary hover:underline text-sm"
            >
              Contact sales
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <h3 className="font-semibold mb-1">Why we guard fee rates</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Protect platform margin and payment/fraud coverage</li>
            <li>Keep consistent pricing across categories and geos</li>
            <li>Avoid race-to-zero scenarios that harm reliability and support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
