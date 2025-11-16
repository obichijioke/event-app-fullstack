'use client';

import { useState } from 'react';
import { CheckinDto } from '@/lib/types/organizer';
import { X, UserCheck } from 'lucide-react';

interface Attendee {
  id: string;
  owner: {
    name: string;
    email: string;
  };
  ticketType: {
    name: string;
  };
}

interface CheckInModalProps {
  attendee: Attendee;
  onSubmit: (data: CheckinDto) => Promise<void>;
  onCancel: () => void;
}

export function CheckInModal({ attendee, onSubmit, onCancel }: CheckInModalProps) {
  const [loading, setLoading] = useState(false);
  const [gate, setGate] = useState('Main Entrance');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ticketId: attendee.id,
        gate,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Check In Attendee</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-secondary rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-secondary/30 border border-border rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket:</span>
                <span className="font-mono font-medium">{attendee.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attendee:</span>
                <span className="font-medium">{attendee.owner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{attendee.owner.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket Type:</span>
                <span className="font-medium">{attendee.ticketType.name}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Gate / Entry Point
            </label>
            <input
              type="text"
              value={gate}
              onChange={(e) => setGate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Main Entrance, VIP Gate"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Specify which gate or entry point was used
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-border rounded-md hover:bg-secondary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Checking In...' : 'Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
