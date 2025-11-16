import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy and data protection',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 1, 2025</p>

        <div className="prose prose-slate max-w-none bg-card rounded-lg shadow-card p-8">
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, including name, email address, phone number, payment information, and any other information you choose to provide.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Process your ticket purchases and transactions</li>
            <li>Send you order confirmations and tickets</li>
            <li>Communicate with you about events and updates</li>
            <li>Improve our platform and services</li>
            <li>Prevent fraud and ensure platform security</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>
            We may share your information with:
          </p>
          <ul>
            <li>Event organizers for events you purchase tickets to</li>
            <li>Payment processors to complete transactions</li>
            <li>Service providers who assist in platform operations</li>
            <li>Law enforcement when required by law</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2>5. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our platform and hold certain information to improve user experience.
          </p>

          <h2>6. Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to data processing</li>
            <li>Data portability</li>
          </ul>

          <h2>7. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required by law.
          </p>

          <h2>8. Children&apos;s Privacy</h2>
          <p>
            Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </p>

          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.
          </p>

          <h2>10. Changes to Privacy Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have questions about this privacy policy, please contact us at privacy@example.com.
          </p>
        </div>
      </div>
    </div>
  );
}
