'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, Users, Star, Loader2 } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { MetricCard } from '@/components/organizer/analytics/metric-card';
import { TicketStatusChart } from '@/components/organizer/analytics/ticket-status-chart';
import { ReviewsSection } from '@/components/organizer/analytics/reviews-section';
import { EmptyState } from '@/components/organizer/empty-state';
import type { DashboardEvent, EventAnalytics, OrganizationInsights } from '@/lib/types/organizer';

export default function AnalyticsPage() {
  const { currentOrganization } = useOrganizerStore();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventAnalytics, setEventAnalytics] = useState<EventAnalytics | null>(null);
  const [orgInsights, setOrgInsights] = useState<OrganizationInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'event' | 'organization'>('organization');

  useEffect(() => {
    async function loadInitialData() {
      if (!currentOrganization) return;

      try {
        setLoading(true);
        setError(null);

        // Load events and organization insights
        const [eventsData, insightsData] = await Promise.all([
          organizerApi.events.list({ orgId: currentOrganization.id }),
          organizerApi.analytics.getOrganizationInsights(currentOrganization.id),
        ]);

        setEvents(eventsData);
        setOrgInsights(insightsData);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [currentOrganization]);

  useEffect(() => {
    async function loadEventAnalytics() {
      if (!currentOrganization || !selectedEventId) return;

      try {
        setLoadingAnalytics(true);
        const data = await organizerApi.analytics.getEventAnalytics(
          selectedEventId,
          currentOrganization.id
        );
        setEventAnalytics(data);
      } catch (err) {
        console.error('Failed to load event analytics:', err);
      } finally {
        setLoadingAnalytics(false);
      }
    }

    if (selectedEventId) {
      loadEventAnalytics();
    }
  }, [selectedEventId, currentOrganization]);

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="No Organization Selected"
          description="Please select an organization to view analytics"
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Failed to Load Analytics"
          description={error}
          action={
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  const totalTickets = eventAnalytics
    ? eventAnalytics.tickets.issued + eventAnalytics.tickets.checked_in + eventAnalytics.tickets.refunded
    : 0;

  const checkInRate = eventAnalytics && totalTickets > 0
    ? ((eventAnalytics.tickets.checked_in / totalTickets) * 100).toFixed(1)
    : '0';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            {viewMode === 'organization' ? 'Organization insights' : 'Event performance metrics'}
          </p>
        </div>
        <Link
          href="/organizer"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('organization')}
          className={`px-4 py-2 rounded-lg transition ${
            viewMode === 'organization'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:opacity-90'
          }`}
        >
          Organization Insights
        </button>
        <button
          onClick={() => setViewMode('event')}
          className={`px-4 py-2 rounded-lg transition ${
            viewMode === 'event'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:opacity-90'
          }`}
        >
          Event Analytics
        </button>
      </div>

      {/* Organization Insights View */}
      {viewMode === 'organization' && orgInsights && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Total Followers"
              value={orgInsights.followers.toLocaleString()}
              icon={Users}
              iconColor="text-blue-600"
            />
            <MetricCard
              title="Average Rating"
              value={`${orgInsights.reviews.averageRating.toFixed(1)} / 5.0`}
              icon={Star}
              iconColor="text-amber-500"
            />
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
            <ReviewsSection
              averageRating={orgInsights.reviews.averageRating}
              total={orgInsights.reviews.total}
              reviews={orgInsights.reviews.recent}
            />
          </div>
        </div>
      )}

      {/* Event Analytics View */}
      {viewMode === 'event' && (
        <div className="space-y-6">
          {/* Event Selector */}
          <div className="bg-card rounded-lg border border-border p-4">
            <label htmlFor="event-select" className="block text-sm font-medium mb-2">
              Select Event
            </label>
            <select
              id="event-select"
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(e.target.value || null)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Select an event --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} - {new Date(event.startAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* Event Analytics Content */}
          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !selectedEventId ? (
            <EmptyState
              title="No Event Selected"
              description="Select an event from the dropdown above to view its analytics"
            />
          ) : eventAnalytics ? (
            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Total Tickets"
                  value={totalTickets.toLocaleString()}
                  icon={BarChart3}
                  iconColor="text-blue-600"
                />
                <MetricCard
                  title="Check-in Rate"
                  value={`${checkInRate}%`}
                  icon={TrendingUp}
                  iconColor="text-green-600"
                />
                <MetricCard
                  title="Average Rating"
                  value={`${eventAnalytics.reviews.averageRating.toFixed(1)} / 5.0`}
                  icon={Star}
                  iconColor="text-amber-500"
                />
              </div>

              {/* Ticket Status Breakdown */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold mb-4">Ticket Status Breakdown</h3>
                <TicketStatusChart data={eventAnalytics.tickets} />
              </div>

              {/* Reviews */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold mb-4">Reviews</h3>
                <ReviewsSection
                  averageRating={eventAnalytics.reviews.averageRating}
                  total={eventAnalytics.reviews.total}
                  reviews={eventAnalytics.reviews.recent}
                />
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Analytics Available"
              description="Analytics data is not available for this event"
            />
          )}
        </div>
      )}
    </div>
  );
}
