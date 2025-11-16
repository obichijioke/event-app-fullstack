import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund and cancellation policy',
};

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2025</p>

        <div className="prose prose-slate max-w-none bg-card rounded-lg shadow-card p-8">
          <h2>1. General Refund Policy</h2>
          <p>
            Refund policies vary by event and are set by the event organizer. Please review the specific refund policy for each event before purchasing tickets.
          </p>

          <h2>2. Event Cancellation</h2>
          <p>
            If an event is cancelled by the organizer, you will receive a full refund including all fees. Refunds are typically processed within 5-10 business days.
          </p>

          <h2>3. Event Postponement</h2>
          <p>
            If an event is postponed, your tickets will remain valid for the new date. If you cannot attend the rescheduled event, you may request a refund according to the organizer&apos;s policy.
          </p>

          <h2>4. Customer-Initiated Refunds</h2>
          <p>
            Refund eligibility for customer-initiated requests depends on the event organizer&apos;s policy. Some events may offer:
          </p>
          <ul>
            <li>Full refund up to a certain date before the event</li>
            <li>Partial refund with a cancellation fee</li>
            <li>No refunds (all sales final)</li>
          </ul>

          <h2>5. Service Fees</h2>
          <p>
            Service fees are generally non-refundable unless the event is cancelled by the organizer. Payment processing fees may also be non-refundable.
          </p>

          <h2>6. How to Request a Refund</h2>
          <p>
            To request a refund:
          </p>
          <ol>
            <li>Log in to your account</li>
            <li>Go to your order history</li>
            <li>Select the order you wish to refund</li>
            <li>Click &quot;Request Refund&quot; and follow the prompts</li>
          </ol>

          <h2>7. Refund Processing Time</h2>
          <p>
            Approved refunds are typically processed within 5-10 business days. The time it takes for the refund to appear in your account depends on your payment method and financial institution.
          </p>

          <h2>8. Ticket Transfers</h2>
          <p>
            If refunds are not available, you may be able to transfer your tickets to another person. Check the event&apos;s transfer policy for details.
          </p>

          <h2>9. Fraudulent Purchases</h2>
          <p>
            If you believe a purchase was made fraudulently on your account, contact us immediately at support@example.com.
          </p>

          <h2>10. Disputes</h2>
          <p>
            If you have a dispute regarding a refund, please contact our support team. We will work with you and the event organizer to resolve the issue.
          </p>

          <h2>11. Force Majeure</h2>
          <p>
            In cases of force majeure (natural disasters, pandemics, etc.), refund policies may be adjusted. We will communicate any changes via email and platform notifications.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            For questions about refunds, please contact us at refunds@example.com or visit our Help Center.
          </p>
        </div>
      </div>
    </div>
  );
}
