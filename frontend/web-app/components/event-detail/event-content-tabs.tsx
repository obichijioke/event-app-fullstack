'use client';

import { useState } from 'react';
import { TabNavigation } from './tab-navigation';
import { EventOverview } from './event-overview';
import { DetailPanels } from './detail-panels';
import { GoogleMap } from './google-map';
import { ReviewList } from './review-list';
import { EventAnnouncements } from './event-announcements';
import { TicketSelector } from './ticket-selector';
import type { EventDetailSummary } from '@/lib/events';
import type { EventSummary } from '@/lib/homepage';

interface EventContentTabsProps {
  description: string;
  assets: EventDetailSummary['assets'];
  summary: EventSummary;
  occurrences: EventDetailSummary['occurrences'];
  policies: EventDetailSummary['policies'];
  tickets: EventDetailSummary['tickets'];
  sidebar: React.ReactNode;
}

export function EventContentTabs({
  description,
  assets,
  summary,
  occurrences,
  policies,
  tickets,
  sidebar,
}: EventContentTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Tab Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Event Announcements - Shown on all tabs */}
            <EventAnnouncements />

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <EventOverview description={description} assets={assets} />
                <DetailPanels summary={summary} occurrences={occurrences} policies={policies} />
              </div>
            )}

            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Available Tickets</h2>
                <TicketSelector
                  tickets={tickets}
                  eventId={summary.id}
                  eventTitle={summary.title}
                />
              </div>
            )}

            {/* Venue Tab */}
            {activeTab === 'venue' && (
              <div className="rounded border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-6">Venue Information</h2>
                {summary.venue ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-2">
                        {summary.venue.name}
                      </h3>
                      <p className="text-muted-foreground">
                        {[
                          (summary.venue as any).address,
                          (summary.venue as any).city,
                          (summary.venue as any).region,
                          (summary.venue as any).country,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>

                    {/* Google Maps Integration */}
                    <GoogleMap
                      address={[
                        (summary.venue as any).address,
                        (summary.venue as any).city,
                        (summary.venue as any).region,
                        (summary.venue as any).country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                      latitude={(summary.venue as any).latitude ? Number((summary.venue as any).latitude) : null}
                      longitude={(summary.venue as any).longitude ? Number((summary.venue as any).longitude) : null}
                      venueName={summary.venue.name || undefined}
                      className="w-full h-96"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-border rounded">
                        <h4 className="font-medium text-foreground mb-2">Getting There</h4>
                        <p className="text-sm text-muted-foreground">
                          Public transportation and parking information will be available closer to the event date.
                        </p>
                      </div>
                      <div className="p-4 border border-border rounded">
                        <h4 className="font-medium text-foreground mb-2">Accessibility</h4>
                        <p className="text-sm text-muted-foreground">
                          This venue is wheelchair accessible with designated parking and seating areas.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Venue information to be announced.</p>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="rounded border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-6">Event Reviews</h2>
                <ReviewList eventId={summary.id} />
              </div>
            )}
          </div>

          {/* Right Column - Sidebar (always visible) */}
          <div className="lg:col-span-1">
            {sidebar}
          </div>
        </div>
      </div>
    </>
  );
}

