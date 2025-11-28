'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { MetricCard } from '../metric-card';
import { StatCard } from '../stat-card';
import { EmptyState } from '../empty-state';
import { OrderItem } from '../order-item';
import { EventItem } from '../event-item';
import { InProgressEvents } from './in-progress-events';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { Calendar, DollarSign, Ticket, ShoppingCart, AlertCircle, FileText, MapPin } from 'lucide-react';
import type { DashboardOverviewResponse } from '@/lib/types/organizer';

export function DashboardContent() {
  const { currentOrganization } = useOrganizerStore();
  const [dashboard, setDashboard] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);
      const data = await organizerApi.dashboard.getOverview(currentOrganization.id);
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization]);

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={<AlertCircle className="w-12 h-12" />}
          title="No Organization Selected"
          description="Please select an organization to view the dashboard"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          icon={<AlertCircle className="w-12 h-12" />}
          title="Error Loading Dashboard"
          description={error}
        />
      </div>
    );
  }

  const creatorUrl = '/organizer/events/create';
  const currency = dashboard?.metrics.currency || 'USD';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back to {currentOrganization.name}
          </p>
        </div>
        
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <MetricCard
          label="Upcoming Events"
          value={dashboard?.metrics.upcomingEvents ?? 0}
          icon={<Calendar className="w-5 h-5" />}
          loading={loading}
        />
        <MetricCard
          label="Total Venues"
          value={dashboard?.metrics.totalVenues ?? 0}
          icon={<MapPin className="w-5 h-5" />}
          loading={loading}
        />
        <MetricCard
          label="Tickets Sold"
          value={dashboard?.metrics.ticketsSold ?? 0}
          icon={<Ticket className="w-5 h-5" />}
          loading={loading}
        />
        <MetricCard
          label="Gross Revenue"
          value={
            dashboard
              ? (
                <CurrencyDisplay
                  amountCents={dashboard.metrics.grossRevenueCents}
                  currency={currency}
                  showFree={false}
                />
              )
              : '$0'
          }
          icon={<DollarSign className="w-5 h-5" />}
          loading={loading}
        />
        <MetricCard
          label="Total Orders"
          value={dashboard?.metrics.ordersCount ?? 0}
          icon={<ShoppingCart className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* In Progress Events Section */}
      {dashboard && dashboard.tasks.inProgressDrafts && dashboard.tasks.inProgressDrafts.length > 0 && (
        <div className="mb-8">
          <InProgressEvents
            drafts={dashboard.tasks.inProgressDrafts}
            orgId={currentOrganization.id}
            onDraftDeleted={loadDashboard}
          />
        </div>
      )}

      {/* Tasks Section */}
      {dashboard && (dashboard.tasks.drafts.length > 0 || dashboard.tasks.moderationAlerts > 0 || dashboard.tasks.unsettledPayouts.count > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Draft Events */}
          {dashboard.tasks.drafts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">Draft Events (Legacy)</h3>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                {dashboard.tasks.drafts.length} event(s) waiting to be published
              </p>
              <Link
                href="/organizer/events?status=draft"
                className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
              >
                View Drafts →
              </Link>
            </div>
          )}

          {/* Moderation Alerts */}
          {dashboard.tasks.moderationAlerts > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Moderation Alerts</h3>
              </div>
              <p className="text-sm text-red-700 mb-3">
                {dashboard.tasks.moderationAlerts} flag(s) require attention
              </p>
              <Link
                href="/organizer/notifications"
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Review Flags →
              </Link>
            </div>
          )}

          {/* Unsettled Payouts */}
          {dashboard.tasks.unsettledPayouts.count > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Pending Payouts</h3>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                <CurrencyDisplay
                  amountCents={dashboard.tasks.unsettledPayouts.amountCents}
                  currency={currency}
                  showFree={false}
                />{' '}
                in {dashboard.tasks.unsettledPayouts.count} payout(s)
              </p>
              <Link
                href="/organizer/payouts"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Payouts →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <StatCard
            title="Recent Orders"
            action={
              <Link href="/organizer/events" className="text-sm text-primary hover:underline">
                View All
              </Link>
            }
          >
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : dashboard?.recentOrders && dashboard.recentOrders.length > 0 ? (
                dashboard.recentOrders.map((order) => (
                  <OrderItem key={order.id} order={order} />
                ))
              ) : (
                <EmptyState
                  title="No recent orders"
                  description="Orders will appear here when customers make purchases"
                />
              )}
            </div>
          </StatCard>

          {/* Upcoming Events */}
          <StatCard
            title="Upcoming Events"
            action={
              <Link href="/organizer/events" className="text-sm text-primary hover:underline">
                View All
              </Link>
            }
          >
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : dashboard?.upcomingEvents && dashboard.upcomingEvents.length > 0 ? (
                dashboard.upcomingEvents.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))
              ) : (
                <EmptyState
                  title="No upcoming events"
                  description="Create your first event to get started"
                  action={
                    <Link
                      href={creatorUrl}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                    >
                      Create Event
                    </Link>
                  }
                />
              )}
            </div>
          </StatCard>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Financial Summary */}
          <StatCard title="Financial Summary">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-6 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : dashboard ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gross Revenue</span>
                  <span className="font-semibold">
                    <CurrencyDisplay
                      amountCents={dashboard.metrics.grossRevenueCents}
                      currency={currency}
                      showFree={false}
                    />
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Fees</span>
                  <span className="font-semibold text-red-600">
                    -
                    <CurrencyDisplay
                      amountCents={dashboard.metrics.feesCents}
                      currency={currency}
                      showFree={false}
                    />
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Net Revenue</span>
                    <span className="font-bold text-lg">
                      <CurrencyDisplay
                        amountCents={dashboard.metrics.netRevenueCents}
                        currency={currency}
                        showFree={false}
                      />
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </StatCard>

          {/* Quick Actions */}
          <StatCard title="Quick Actions">
            <div className="space-y-2">
              <Link
                href={creatorUrl}
                className="block px-4 py-2 rounded-lg hover:bg-muted transition text-sm"
              >
                Create Event
              </Link>
              <Link
                href="/organizer/venues/create"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition text-sm"
              >
                Add Venue
              </Link>
              <Link
                href="/organizer/seatmaps/create"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition text-sm"
              >
                Create Seatmap
              </Link>
              <Link
                href="/organizer/finance"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition text-sm"
              >
                View Financials
              </Link>
              <Link
                href="/organizer/analytics"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition text-sm"
              >
                View Analytics
              </Link>
              <Link
                href="/organizer/reports"
                className="block px-4 py-2 rounded-lg hover:bg-muted transition text-sm"
              >
                Download Reports
              </Link>
            </div>
          </StatCard>

          {/* Venue Summary */}
          <StatCard
            title="Recent Venues"
            action={
              <Link href="/organizer/venues" className="text-sm text-primary hover:underline">
                View All
              </Link>
            }
          >
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : dashboard?.recentVenues && dashboard.recentVenues.length > 0 ? (
                dashboard.recentVenues.map((venue) => (
                  <Link
                    key={venue.id}
                    href={`/organizer/venues/${venue.id}`}
                    className="block p-3 rounded-lg border border-border hover:border-primary transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{venue.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {venue.address.city}, {venue.address.region}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{venue._count.seatmaps} seatmap{venue._count.seatmaps !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{venue._count.events} event{venue._count.events !== 1 ? 's' : ''}</span>
                      {venue.capacity && (
                        <>
                          <span>•</span>
                          <span>{venue.capacity.toLocaleString()} capacity</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState
                  title="No venues yet"
                  description="Create your first venue to get started"
                  action={
                    <Link
                      href="/organizer/venues/create"
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm"
                    >
                      Create Venue
                    </Link>
                  }
                />
              )}
            </div>
          </StatCard>

          {/* Help */}
          <div className="bg-primary/10 border border-primary rounded-lg p-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Check out our organizer guide for tips and best practices
            </p>
            <Link href="/help" className="text-sm text-primary hover:underline font-medium">
              View Guide →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
