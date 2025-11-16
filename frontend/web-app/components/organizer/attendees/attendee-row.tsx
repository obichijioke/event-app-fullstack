'use client';

import { Check, Mail, UserCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/format';

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

interface AttendeeRowProps {
  attendee: Attendee;
  onCheckIn: (attendee: Attendee) => void;
  onResend: (attendee: Attendee) => void;
}

export function AttendeeRow({ attendee, onCheckIn, onResend }: AttendeeRowProps) {
  const statusColors = {
    issued: 'bg-green-100 text-green-800 border-green-200',
    refunded: 'bg-red-100 text-red-800 border-red-200',
    transferred: 'bg-blue-100 text-blue-800 border-blue-200',
    checked_in: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const isCheckedIn = attendee.checkedInAt !== null && attendee.checkedInAt !== undefined;

  return (
    <tr className="border-b border-border hover:bg-secondary/50 transition">
      <td className="px-4 py-3">
        <span className="font-mono text-sm">{attendee.id}</span>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{attendee.owner.name}</p>
          <p className="text-sm text-muted-foreground">{attendee.owner.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium">{attendee.ticketType.name}</p>
          <p className="text-xs text-muted-foreground">{attendee.ticketType.kind}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[attendee.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
          {attendee.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-4 py-3">
        {isCheckedIn ? (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-4 h-4" />
            <div className="text-sm">
              <p className="font-medium">{formatDateTime(attendee.checkedInAt!)}</p>
              {attendee.gate && <p className="text-xs text-muted-foreground">{attendee.gate}</p>}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Not checked in</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {!isCheckedIn && attendee.status === 'issued' && (
            <button
              onClick={() => onCheckIn(attendee)}
              className="p-2 hover:bg-green-50 text-green-600 rounded-md transition"
              title="Check in"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onResend(attendee)}
            className="p-2 hover:bg-secondary rounded-md transition"
            title="Resend ticket"
          >
            <Mail className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
