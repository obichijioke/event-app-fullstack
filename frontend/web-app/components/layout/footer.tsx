'use client';

import Link from 'next/link';
import { Text } from '@/components/ui';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Discover',
      links: [
        { name: 'Browse Events', href: '/events' },
        { name: 'Categories', href: '/categories' },
        { name: 'Organizers', href: '/organizers' },
        { name: 'Venues', href: '/venues' },
        { name: 'Search', href: '/search' },
      ],
    },
    {
      title: 'Organize',
      links: [
        { name: 'Create Event', href: '/organizer/onboarding' },
        { name: 'Organizer Dashboard', href: '/organizer' },
        { name: 'Pricing', href: '/organizer/pricing' },
        { name: 'Resources', href: '/organizer/resources' },
        { name: 'API Documentation', href: '/organizer/api-docs' },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', href: '/help' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'FAQs', href: '/help/faqs' },
        { name: 'Safety', href: '/help/safety' },
        { name: 'Accessibility', href: '/help/accessibility' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/about/careers' },
        { name: 'Press', href: '/about/press' },
        { name: 'Blog', href: '/blog' },
        { name: 'Partners', href: '/about/partners' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Refund Policy', href: '/refund-policy' },
        { name: 'Cookie Policy', href: '/privacy/cookies' },
        { name: 'Community Guidelines', href: '/terms/community' },
      ],
    },
  ];

  const socialLinks = [
    { name: 'Twitter', href: 'https://twitter.com/eventhub', icon: TwitterIcon },
    { name: 'Facebook', href: 'https://facebook.com/eventhub', icon: FacebookIcon },
    { name: 'Instagram', href: 'https://instagram.com/eventhub', icon: InstagramIcon },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/eventhub', icon: LinkedInIcon },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-xl font-bold">E</span>
              </div>
              <span className="text-2xl font-bold text-foreground">EventHub</span>
            </Link>
            <Text className="mb-6 max-w-sm text-muted-foreground">
              Discover and book the best events across Africa. From concerts to conferences, find
              unforgettable experiences near you.
            </Text>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-primary"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Stay updated with the latest events
              </h3>
              <Text className="mb-4 text-sm text-muted-foreground">
                Subscribe to our newsletter and never miss out on exciting events in your area.
              </Text>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* App Download Section */}
            <div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Download our app</h3>
              <Text className="mb-4 text-sm text-muted-foreground">
                Get the EventHub app for the best mobile experience.
              </Text>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-2 transition-colors hover:bg-muted"
                >
                  <AppleIcon className="h-6 w-6" />
                  <div>
                    <Text className="text-xs text-muted-foreground">Download on the</Text>
                    <Text className="text-sm font-semibold text-foreground">App Store</Text>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-2 transition-colors hover:bg-muted"
                >
                  <PlayStoreIcon className="h-6 w-6" />
                  <div>
                    <Text className="text-xs text-muted-foreground">Get it on</Text>
                    <Text className="text-sm font-semibold text-foreground">Google Play</Text>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <Text className="text-sm text-muted-foreground">
            © {currentYear} EventHub. All rights reserved.
          </Text>

          {/* Payment Methods */}
          <div className="flex items-center gap-4">
            <Text className="text-xs text-muted-foreground">We accept:</Text>
            <div className="flex items-center gap-2">
              <div className="flex h-8 items-center rounded border border-border bg-background px-2">
                <Text className="text-xs font-semibold text-foreground">VISA</Text>
              </div>
              <div className="flex h-8 items-center rounded border border-border bg-background px-2">
                <Text className="text-xs font-semibold text-foreground">Mastercard</Text>
              </div>
              <div className="flex h-8 items-center rounded border border-border bg-background px-2">
                <Text className="text-xs font-semibold text-foreground">Paystack</Text>
              </div>
            </div>
          </div>

          {/* Language/Region Selector */}
          <div className="flex items-center gap-2">
            <GlobeIcon className="h-4 w-4 text-muted-foreground" />
            <select className="rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="en-NG">English (Nigeria)</option>
              <option value="en-GH">English (Ghana)</option>
              <option value="en-KE">English (Kenya)</option>
              <option value="en-ZA">English (South Africa)</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Social Media Icons
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function PlayStoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.22 0c-.03.093-.06.185-.06.308v23.229c0 .217.061.34.184.463l11.415-12.093L1.22 0zm12.309 12.708l2.951 3.045-4.213 2.4s-5.355 3.044-8.308 4.739l9.57-10.184zm.6-.6L3.862 1.8l11.967 6.814-1.7 1.756v1.938zm9.655 1.046c.4-.215.4-.862 0-1.077l-3.844-2.169-3.013 3.106 3.013 3.106 3.844-2.169.031-.031-.031-.031v.265z" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
