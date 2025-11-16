import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Get help and support',
};

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">How can we help you?</h1>
        <p className="text-center text-muted-foreground mb-8">
          Search our help center or browse categories below
        </p>

        {/* Search */}
        <div className="mb-12">
          <input
            type="text"
            placeholder="Search for help..."
            className="w-full px-6 py-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-lg"
          />
        </div>

        {/* Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/help/getting-started" className="bg-card rounded-lg p-6 shadow-card hover:shadow-card-hover transition">
            <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
            <p className="text-sm text-muted-foreground">Learn the basics of using our platform</p>
          </Link>
          
          <Link href="/help/buying-tickets" className="bg-card rounded-lg p-6 shadow-card hover:shadow-card-hover transition">
            <h3 className="font-semibold text-lg mb-2">Buying Tickets</h3>
            <p className="text-sm text-muted-foreground">How to purchase and manage tickets</p>
          </Link>
          
          <Link href="/help/account" className="bg-card rounded-lg p-6 shadow-card hover:shadow-card-hover transition">
            <h3 className="font-semibold text-lg mb-2">Account & Settings</h3>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </Link>
          
          <Link href="/help/payments" className="bg-card rounded-lg p-6 shadow-card hover:shadow-card-hover transition">
            <h3 className="font-semibold text-lg mb-2">Payments & Refunds</h3>
            <p className="text-sm text-muted-foreground">Payment methods and refund policies</p>
          </Link>
          
          <Link href="/help/organizers" className="bg-card rounded-lg p-6 shadow-card hover:shadow-card-hover transition">
            <h3 className="font-semibold text-lg mb-2">For Organizers</h3>
            <p className="text-sm text-muted-foreground">Create and manage events</p>
          </Link>
          
          <Link href="/help/troubleshooting" className="bg-card rounded-lg p-6 shadow-card hover:shadow-card-hover transition">
            <h3 className="font-semibold text-lg mb-2">Troubleshooting</h3>
            <p className="text-sm text-muted-foreground">Common issues and solutions</p>
          </Link>
        </div>

        {/* Popular Articles */}
        <div className="bg-card rounded-lg p-6 shadow-card mb-8">
          <h2 className="text-xl font-semibold mb-4">Popular Articles</h2>
          <div className="space-y-3">
            <Link href="/help/article/how-to-buy-tickets" className="block text-primary hover:underline">
              How do I buy tickets?
            </Link>
            <Link href="/help/article/transfer-tickets" className="block text-primary hover:underline">
              How do I transfer my tickets?
            </Link>
            <Link href="/help/article/refund-policy" className="block text-primary hover:underline">
              What is your refund policy?
            </Link>
            <Link href="/help/article/payment-methods" className="block text-primary hover:underline">
              What payment methods do you accept?
            </Link>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-primary/10 border border-primary rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
          <p className="text-muted-foreground mb-4">
            Can&apos;t find what you&apos;re looking for? Contact our support team
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition font-medium"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
