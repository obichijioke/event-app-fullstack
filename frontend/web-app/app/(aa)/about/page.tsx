import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn more about us',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">About Us</h1>
        <p className="text-center text-muted-foreground text-lg mb-12">
          Connecting people through unforgettable experiences
        </p>

        {/* Mission */}
        <div className="bg-card rounded-lg shadow-card p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            We&apos;re on a mission to make event discovery and ticketing seamless for everyone.
            Whether you&apos;re an event organizer looking to reach more attendees or someone searching
            for the perfect event, we&apos;re here to make it happen.
          </p>
        </div>

        {/* Story */}
        <div className="bg-card rounded-lg shadow-card p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Founded in 2025, we started with a simple idea: events should be easy to find, tickets should
            be simple to buy, and organizers should have the tools they need to create amazing experiences.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Today, we&apos;re proud to serve thousands of event organizers and millions of attendees across
            Nigeria and beyond, helping bring people together through concerts, conferences, festivals, and more.
          </p>
        </div>

        {/* Values */}
        <div className="bg-card rounded-lg shadow-card p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">🎯 Customer First</h3>
              <p className="text-sm text-muted-foreground">
                We put our customers at the heart of everything we do, ensuring the best experience for both organizers and attendees.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔒 Trust & Security</h3>
              <p className="text-sm text-muted-foreground">
                We prioritize the security of your data and transactions, using industry-leading encryption and security practices.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💡 Innovation</h3>
              <p className="text-sm text-muted-foreground">
                We continuously improve our platform with new features and technologies to enhance the event experience.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🤝 Community</h3>
              <p className="text-sm text-muted-foreground">
                We believe in building strong communities and supporting local events that bring people together.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg shadow-card p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-1">1M+</p>
            <p className="text-sm text-muted-foreground">Tickets Sold</p>
          </div>
          <div className="bg-card rounded-lg shadow-card p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-1">10K+</p>
            <p className="text-sm text-muted-foreground">Events Hosted</p>
          </div>
          <div className="bg-card rounded-lg shadow-card p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-1">500+</p>
            <p className="text-sm text-muted-foreground">Organizers</p>
          </div>
          <div className="bg-card rounded-lg shadow-card p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-1">50+</p>
            <p className="text-sm text-muted-foreground">Cities</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary/10 border border-primary rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Join Us</h2>
          <p className="text-muted-foreground mb-6">
            Whether you&apos;re organizing an event or looking for your next experience, we&apos;re here to help.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/events"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition font-medium"
            >
              Browse Events
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition font-medium"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
