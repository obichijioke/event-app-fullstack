'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  MapPin,
  Map,
  DollarSign,
  Key,
  FileText,
  Webhook,
  Receipt,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface SubItem {
  label: string;
  href: string;
}

interface NavSection {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubItem[];
  badge?: number;
}

const navigation: NavSection[] = [
  {
    label: 'Dashboard',
    href: '/organizer',
    icon: LayoutDashboard
  },
  {
    label: 'Events',
    href: '/organizer/events',
    icon: Calendar
  },
  {
    label: 'Finance',
    icon: DollarSign,
    subItems: [
      { label: 'Overview', href: '/organizer/finance' },
      { label: 'Analytics', href: '/organizer/analytics' },
      { label: 'Reports', href: '/organizer/reports' },
      { label: 'Payouts', href: '/organizer/payouts' },
      { label: 'Refunds', href: '/organizer/refunds' },
      { label: 'Disputes', href: '/organizer/disputes' },
    ],
  },
  {
    label: 'Venues',
    icon: MapPin,
    subItems: [
      { label: 'All Venues', href: '/organizer/venues' },
      { label: 'Seatmaps', href: '/organizer/seatmaps' },
    ],
  },
  {
    label: 'Organization',
    icon: Settings,
    subItems: [
      { label: 'Settings', href: '/organizer/organization' },
      { label: 'Team', href: '/organizer/organization/members' },
      { label: 'Payout Accounts', href: '/organizer/organization/payout-accounts' },
    ],
  },
  {
    label: 'Developers',
    icon: Key,
    subItems: [
      { label: 'API Keys', href: '/organizer/api-keys' },
      { label: 'Webhooks', href: '/organizer/webhooks' },
    ],
  },
];

export function OrganizerSidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isSectionActive = (section: NavSection) => {
    if (section.href && (pathname === section.href || pathname.startsWith(section.href + '/'))) {
      return true;
    }
    if (section.subItems) {
      return section.subItems.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + '/'));
    }
    return false;
  };

  const isSubItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="fixed top-16 left-0 w-64 bg-card border-r border-border h-[calc(100vh-4rem)] overflow-y-auto z-10">
      <nav className="p-4 space-y-1">
        {navigation.map((section) => {
          const Icon = section.icon;
          const isActive = isSectionActive(section);
          const isExpanded = expandedSections.includes(section.label);

          // Simple link (no sub-items)
          if (!section.subItems) {
            return (
              <Link
                key={section.href}
                href={section.href!}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{section.label}</span>
                {section.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {section.badge}
                  </span>
                )}
              </Link>
            );
          }

          // Collapsible section with sub-items
          return (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{section.label}</span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {section.subItems.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                        isSubItemActive(subItem.href)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
