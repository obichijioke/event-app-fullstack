import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with us',
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Contact Us</h1>
        <p className="text-center text-muted-foreground mb-8">
          Have a question? We&apos;re here to help
        </p>

        <div className="bg-card rounded-lg shadow-card p-8">
          <form className="space-y-6">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Category
              </label>
              <select
                id="category"
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Select a category</option>
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Billing & Payments</option>
                <option>Event Issues</option>
                <option>Account Help</option>
                <option>Organizer Support</option>
                <option>Other</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Message
              </label>
              <textarea
                id="message"
                rows={6}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tell us how we can help..."
              ></textarea>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <input type="file" className="hidden" id="fileUpload" multiple />
                <label
                  htmlFor="fileUpload"
                  className="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm cursor-pointer"
                >
                  Choose Files
                </label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition font-medium"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Alternative Contact Methods */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-6 shadow-card text-center">
            <h3 className="font-semibold mb-2">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Get a response within 24 hours
            </p>
            <a href="mailto:support@example.com" className="text-primary hover:underline text-sm">
              support@example.com
            </a>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-card text-center">
            <h3 className="font-semibold mb-2">Help Center</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Find answers to common questions
            </p>
            <Link href="/help" className="text-primary hover:underline text-sm">
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
