'use client';

import { useEffect, useState } from 'react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { CheckinDto } from '@/lib/types/organizer';
import { AttendeeRow } from './attendee-row';
import { CheckInModal } from './check-in-modal';
import { Loader2, Users, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Attendee {
  id: string;
  status: string;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  ticketType: {
    id: string;
    name: string;
    kind: string;
  };
  checkedInAt?: string;
  gate?: string;
}

interface AttendeesContentProps {
  eventId: string;
}

export function AttendeesContent({ eventId }: AttendeesContentProps) {
  const { currentOrganization } = useOrganizerStore();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [checkInAttendee, setCheckInAttendee] = useState<Attendee | null>(null);

  useEffect(() => {
    if (currentOrganization) {
      loadAttendees();
    }
  }, [eventId, currentOrganization, search, status]);

  const loadAttendees = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const data = await organizerApi.attendees.list(
        eventId,
        currentOrganization.id,
        {
          search: search || undefined,
          status: status || undefined,
        }
      );
      setAttendees(data);
    } catch (error) {
      console.error('Failed to load attendees:', error);
      toast.error('Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (data: CheckinDto) => {
    if (!currentOrganization) return;

    try {
      await organizerApi.checkins.create(data, currentOrganization.id);
      toast.success('Attendee checked in successfully');
      setCheckInAttendee(null);
      loadAttendees();
    } catch (error) {
      console.error('Failed to check in attendee:', error);
      toast.error('Failed to check in attendee');
      throw error;
    }
  };

  const handleResend = async (attendee: Attendee) => {
    if (!currentOrganization) return;

    try {
      await organizerApi.tickets.resend(attendee.id, currentOrganization.id);
      toast.success('Ticket resent successfully');
    } catch (error) {
      console.error('Failed to resend ticket:', error);
      toast.error('Failed to resend ticket');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
  };

  const checkedInCount = attendees.filter((a) => a.checkedInAt).length;
  const hasFilters = search || status;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading attendees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Attendees</p>
          <p className="text-3xl font-bold">{attendees.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Checked In</p>
          <p className="text-3xl font-bold text-green-600">{checkedInCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">
            {attendees.length - checkedInCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Filters</h3>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, ticket ID..."
                className="w-full pl-9 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All statuses</option>
              <option value="issued">Issued</option>
              <option value="checked_in">Checked In</option>
              <option value="refunded">Refunded</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendees Table */}
      {attendees.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Attendees Found</h3>
          <p className="text-muted-foreground">
            {hasFilters
              ? 'Try adjusting your filters'
              : 'Attendees will appear here once tickets are issued'}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Ticket ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Attendee</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Ticket Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Check-In</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((attendee) => (
                  <AttendeeRow
                    key={attendee.id}
                    attendee={attendee}
                    onCheckIn={setCheckInAttendee}
                    onResend={handleResend}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {checkInAttendee && (
        <CheckInModal
          attendee={checkInAttendee}
          onSubmit={handleCheckIn}
          onCancel={() => setCheckInAttendee(null)}
        />
      )}
    </div>
  );
}
