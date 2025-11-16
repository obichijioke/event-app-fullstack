'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, QrCode, Users, Clock } from 'lucide-react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import toast from 'react-hot-toast';
import type { CheckinStats as CheckinStatsResponse, RecentCheckin } from '@/lib/types/organizer';

interface CheckinContentProps {
  eventId: string;
}

export function CheckinContent({ eventId }: CheckinContentProps) {
  const { currentOrganization } = useOrganizerStore();
  const [loading, setLoading] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  const [stats, setStats] = useState<CheckinStatsResponse>({
    totalTickets: 0,
    checkedIn: 0,
    pending: 0,
    checkInRate: 0,
  });
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckin[]>([]);
  const [lastCheckIn, setLastCheckIn] = useState<{
    success: boolean;
    message: string;
    attendeeName?: string;
  } | null>(null);

  useEffect(() => {
    loadStats();
    loadRecentCheckins();
  }, [eventId, currentOrganization]);

  const loadStats = async () => {
    if (!currentOrganization) return;

    try {
      const data = await organizerApi.checkins.getStats(eventId, currentOrganization.id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load check-in statistics');
    }
  };

  const loadRecentCheckins = async () => {
    if (!currentOrganization) return;

    try {
      const data = await organizerApi.checkins.getRecent(eventId, currentOrganization.id, 10);
      setRecentCheckins(data);
    } catch (error) {
      console.error('Failed to load recent check-ins:', error);
      toast.error('Failed to load recent check-ins');
    }
  };

  const handleCheckIn = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!ticketCode.trim() || !currentOrganization) return;

    setLoading(true);
    setLastCheckIn(null);

    try {
      const response = await organizerApi.checkins.create(
        {
          ticketId: ticketCode,
        },
        currentOrganization.id
      );

      setLastCheckIn({
        success: true,
        message: 'Check-in successful!',
        attendeeName: response?.ticket?.owner?.name,
      });

      toast.success('Check-in successful!');
      setTicketCode('');
      loadStats();
      loadRecentCheckins();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Check-in failed';
      setLastCheckIn({
        success: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    toast('QR Scanner would open here. Integration with device camera needed.', {
      icon: '📷',
    });
    // TODO: Implement QR code scanner
    // Can use libraries like html5-qrcode or @zxing/browser
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please select an organization</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-2xl font-bold mt-1">{stats.totalTickets}</p>
            </div>
            <Users className="w-8 h-8 text-primary opacity-20" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Checked In</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.checkedIn}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-600 opacity-20" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Check-in Rate</p>
              <p className="text-2xl font-bold mt-1">{stats.checkInRate}%</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{stats.checkInRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Manual Check-in</h2>

          <form onSubmit={handleCheckIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Ticket Code / QR Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="Enter ticket code or scan QR"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleQRScan}
                  className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition"
                  disabled={loading}
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !ticketCode.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check In
                </>
              )}
            </button>
          </form>

          {/* Check-in Result */}
          {lastCheckIn && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                lastCheckIn.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {lastCheckIn.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      lastCheckIn.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {lastCheckIn.message}
                  </p>
                  {lastCheckIn.attendeeName && (
                    <p className="text-sm text-green-700 mt-1">
                      Welcome, {lastCheckIn.attendeeName}!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Check-ins */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Check-ins</h2>

          {recentCheckins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No check-ins yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentCheckins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">{checkin.attendeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {checkin.ticketType} • {checkin.ticketId}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(checkin.scannedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How to use Check-in</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Scan the QR code on the attendee's ticket using the QR scanner button</li>
          <li>Or manually enter the ticket code and click "Check In"</li>
          <li>The system will validate the ticket and mark it as checked in</li>
          <li>Each ticket can only be checked in once</li>
          <li>Check-in statistics update in real-time</li>
        </ul>
      </div>
    </div>
  );
}
