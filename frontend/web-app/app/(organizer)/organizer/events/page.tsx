'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { EventFilters } from '@/components/organizer/events/event-filters';
import { EventCard } from '@/components/organizer/events/event-card';
import { EmptyState } from '@/components/organizer/empty-state';
import type { EventStatus, DashboardEvent } from '@/lib/types/organizer';

export default function EventsPage() {
  const { currentOrganization } = useOrganizerStore();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EventStatus | 'all'>('all');

  useEffect(() => {
    async function loadEvents() {
      if (!currentOrganization) return;

      try {
        setLoading(true);
        const params: any = {
          orgId: currentOrganization.id,
        };

        if (search) params.search = search;
        if (status !== 'all') params.status = status;

        const data = await organizerApi.events.list(params);
        setEvents(data);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [currentOrganization, search, status]);

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
  };

  const creatorUrl = '/organizer/events/create';

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="No Organization Selected"
          description="Please select an organization to view events"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1">Manage all your events</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={creatorUrl}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        </div>
      </div>

      <EventFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onClearFilters={handleClearFilters}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title={search || status !== 'all' ? 'No events found' : 'No events yet'}
          description={
            search || status !== 'all'
              ? 'Try adjusting your filters to see more results'
              : 'Create your first event to get started'
          }
          action={
            !search && status === 'all' ? (
              <Link
                href={creatorUrl}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
              >
                <Plus className="w-4 h-4" />
                Create Your First Event
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {events.length} event{events.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} orgId={currentOrganization.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
