import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2025</p>

        <div className="prose prose-slate max-w-none bg-card rounded-lg shadow-card p-8">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials on our platform for personal, non-commercial transitory viewing only.
          </p>

          <h2>3. Ticket Purchases</h2>
          <p>
            All ticket sales are final unless otherwise stated by the event organizer. Refund policies vary by event.
          </p>

          <h2>4. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </p>

          <h2>5. Event Organizer Responsibilities</h2>
          <p>
            Event organizers are responsible for the accuracy of event information, ticket fulfillment, and compliance with local laws and regulations.
          </p>

          <h2>6. Prohibited Activities</h2>
          <p>
            You may not use our platform for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction.
          </p>

          <h2>7. Payment Terms</h2>
          <p>
            All payments are processed securely through our payment partners. We do not store credit card information on our servers.
          </p>

          <h2>8. Intellectual Property</h2>
          <p>
            The platform and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of any material changes via email or platform notification.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions.
          </p>

          <h2>12. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at legal@example.com.
          </p>
        </div>
      </div>
    </div>
  );
}

