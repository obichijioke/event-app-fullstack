'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Ticket,
  ArrowLeft,
  Edit,
  ShoppingCart,
  UserCheck,
  Settings,
  Tag,
  Loader2,
} from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { MetricCard } from '../metric-card';
import { StatCard } from '../stat-card';
import { EmptyState } from '../empty-state';
import { EventStatusActions } from './event-status-actions';
import { CurrencyDisplay } from '@/components/common/currency-display';
import type { DashboardEvent, EventAnalytics, InventorySnapshot } from '@/lib/types/organizer';

interface EventDetailContentProps {
  eventId: string;
}

export function EventDetailContent({ eventId }: EventDetailContentProps) {
  const { currentOrganization } = useOrganizerStore();
  const [event, setEvent] = useState<DashboardEvent & { venue?: any; category?: any } | null>(null);
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [inventory, setInventory] = useState<InventorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvent = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);
      const [eventData, inventoryData, analyticsData] = await Promise.all([
        organizerApi.events.get(eventId, currentOrganization.id),
        organizerApi.inventory
          .getSnapshot(eventId, currentOrganization.id)
          .catch((err) => {
            console.warn('Failed to load inventory snapshot:', err);
            return null;
          }),
        organizerApi.analytics
          .getEventAnalytics(eventId, currentOrganization.id)
          .catch((err) => {
            console.warn('Failed to load event analytics:', err);
            return null;
          }),
      ]);
      setEvent(eventData);
      setInventory(inventoryData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
      console.error('Event error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [currentOrganization, eventId]);

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="No Organization Selected"
          description="Please select an organization to view event details"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState title="Error Loading Event" description={error || 'Event not found'} />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    live: 'bg-green-100 text-green-800 border-green-200',
    paused: 'bg-orange-100 text-orange-800 border-orange-200',
    canceled: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const quickLinks = [
    { href: `/organizer/events/${eventId}/edit`, icon: Edit, label: 'Edit Event' },
    { href: `/organizer/events/${eventId}/venue`, icon: MapPin, label: 'Venue' },
    { href: `/organizer/events/${eventId}/tickets`, icon: Ticket, label: 'Manage Tickets' },
    { href: `/organizer/events/${eventId}/orders`, icon: ShoppingCart, label: 'View Orders' },
    { href: `/organizer/events/${eventId}/attendees`, icon: Users, label: 'Attendees' },
    { href: `/organizer/events/${eventId}/check-in`, icon: UserCheck, label: 'Check-In' },
    { href: `/organizer/events/${eventId}/promo-codes`, icon: Tag, label: 'Promo Codes' },
    {
      href: `/organizer/events/${eventId}/occurrences`,
      icon: Calendar,
      label: 'Occurrences',
    },
    { href: `/organizer/events/${eventId}/seatmap`, icon: Settings, label: 'Seatmap' },
  ];

  const ticketsSold = inventory?.totals.sold ?? analytics?.tickets.issued ?? 0;
  const revenueCents = inventory?.totals.grossRevenueCents ?? 0;
  const ordersCount = analytics?.tickets.issued ?? ticketsSold;
  const checkedIn = inventory?.totals.checkedIn ?? analytics?.tickets.checked_in ?? 0;
  const currency =
    (event as any)?.currency || inventory?.ticketTypes?.[0]?.currency || 'USD';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
              <span
                className={`px-3 py-1 text-sm font-medium rounded border ${
                  statusColors[event.status]
                }`}
              >
                {event.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(event.startAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {event.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.venue.name}</span>
                </div>
              )}
            </div>
          </div>
          <Link
            href="/organizer/events"
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </div>
          </Link>
        </div>

        <EventStatusActions
          eventId={eventId}
          orgId={currentOrganization.id}
          currentStatus={event.status}
          onStatusChange={loadEvent}
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label="Tickets Sold"
          value={ticketsSold}
          icon={<Ticket className="w-5 h-5" />}
        />
        <MetricCard
          label="Revenue"
          value={
            <CurrencyDisplay
              amountCents={revenueCents}
              currency={currency}
              showFree={false}
            />
          }
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          label="Orders"
          value={ordersCount}
          icon={<ShoppingCart className="w-5 h-5" />}
        />
        <MetricCard
          label="Checked In"
          value={checkedIn}
          icon={<UserCheck className="w-5 h-5" />}
        />
      </div>

      {/* Quick Links */}
      <StatCard title="Quick Actions" className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href={`/organizer/events/${eventId}/venue`}
            className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg hover:bg-muted transition"
          >
            <MapPin className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-center">Manage Venue</span>
          </Link>
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg hover:bg-muted transition"
              >
                <Icon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-center">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </StatCard>

      {/* Event Details */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <StatCard title="Event Information">
            <div className="space-y-4">
              {event.descriptionMd && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    {event.descriptionMd}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Visibility</p>
                  <p className="font-medium capitalize">{event.visibility || 'Public'}</p>
                </div>
                {event.category && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Category</p>
                    <p className="font-medium">{event.category.name}</p>
                  </div>
                )}
                {event.doorTime && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Door Time</p>
                    <p className="font-medium">
                      {new Date(event.doorTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
                {event.publishAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Published At</p>
                    <p className="font-medium">
                      {new Date(event.publishAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </StatCard>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <StatCard title="Venue">
            {event.venue ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{event.venue.name}</span>
                </div>
                {event.venue.address && (
                  <p className="text-sm text-muted-foreground">
                    {event.venue.address.line1}
                    {event.venue.address.city ? `, ${event.venue.address.city}` : ''}
                  </p>
                )}
                <Link
                  href={`/organizer/events/${eventId}/venue`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Edit className="w-4 h-4" />
                  Manage venue
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">No venue selected yet.</p>
                <Link
                  href={`/organizer/events/${eventId}/venue`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Edit className="w-4 h-4" />
                  Add a venue
                </Link>
              </div>
            )}
          </StatCard>
          <StatCard title="Event Links">
            <div className="space-y-2">
              <a
                href={`/events/${eventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-center text-sm"
              >
                View Public Page
              </a>
              <Link
                href={`/organizer/events/${eventId}/edit`}
                className="block px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-center text-sm"
              >
                Edit Event Details
              </Link>
            </div>
          </StatCard>
        </div>
      </div>
    </div>
  );
}
