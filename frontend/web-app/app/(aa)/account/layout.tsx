'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Ticket,
  ShoppingBag,
  RefreshCw,
  Heart,
  RotateCcw,
  Shield,
  LayoutDashboard
} from 'lucide-react';

const accountNavItems = [
  {
    name: 'Dashboard',
    href: '/account',
    icon: LayoutDashboard,
    description: 'Overview of your account',
  },
  {
    name: 'Profile',
    href: '/account/profile',
    icon: User,
    description: 'Manage your profile information',
  },
  {
    name: 'Security',
    href: '/account/security',
    icon: Shield,
    description: 'Password, 2FA, sessions, and API keys',
  },
  {
    name: 'Tickets',
    href: '/account/tickets',
    icon: Ticket,
    description: 'View your upcoming and past tickets',
  },
  {
    name: 'Orders',
    href: '/account/orders',
    icon: ShoppingBag,
    description: 'Track your order history',
  },
  {
    name: 'Transfers',
    href: '/account/transfers',
    icon: RefreshCw,
    description: 'Manage ticket transfers',
  },
  {
    name: 'Following',
    href: '/account/following',
    icon: Heart,
    description: 'Organizers you follow',
  },
  {
    name: 'Refunds',
    href: '/account/refunds',
    icon: RotateCcw,
    description: 'View refund requests',
  },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-card rounded-lg border border-border p-4 sticky top-4">
            <h2 className="text-lg font-semibold mb-4 px-2">My Account</h2>
            <nav className="space-y-1">
              {accountNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.name}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile Navigation - Shows at top on small screens */}
          <div className="lg:hidden mb-6">
            <select
              value={pathname}
              onChange={(e) => {
                window.location.href = e.target.value;
              }}
              className="w-full px-4 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {accountNavItems.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
