'use client';

import { TicketType } from '@/lib/types/organizer';
import { Edit, Trash2, DollarSign, Users, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface TicketTypeCardProps {
  ticketType: TicketType;
  onEdit: (ticketType: TicketType) => void;
  onDelete: (ticketType: TicketType) => void;
}

export function TicketTypeCard({ ticketType, onEdit, onDelete }: TicketTypeCardProps) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    sold_out: 'bg-red-100 text-red-800 border-red-200',
  };

  const kindLabels: Record<string, string> = {
    GA: 'General Admission',
    SEATED: 'Seated',
    VIP: 'VIP',
    EARLY_BIRD: 'Early Bird',
  };

  const available = ticketType.capacity - (ticketType.sold || 0);
  const percentageSold = ticketType.capacity > 0
    ? Math.round(((ticketType.sold || 0) / ticketType.capacity) * 100)
    : 0;

  return (
    <div className="border border-border rounded-lg p-6 hover:border-primary/50 transition bg-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{ticketType.name}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[ticketType.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
              {ticketType.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{kindLabels[ticketType.kind] || ticketType.kind}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(ticketType)}
            className="p-2 hover:bg-secondary rounded-md transition"
            title="Edit ticket type"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(ticketType)}
            className="p-2 hover:bg-red-50 text-red-600 rounded-md transition"
            title="Delete ticket type"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="font-semibold">
              {formatCurrency(ticketType.priceCents, ticketType.currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Capacity</p>
            <p className="font-semibold">{ticketType.capacity}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Sold</p>
            <p className="font-semibold">{ticketType.sold || 0}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Sales Progress</span>
          <span className="font-medium">{percentageSold}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${percentageSold}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {available} of {ticketType.capacity} available
        </p>
      </div>

      {(ticketType.salesStart || ticketType.salesEnd) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border">
          <Calendar className="w-3 h-3" />
          <span>
            Sales: {ticketType.salesStart ? new Date(ticketType.salesStart).toLocaleDateString() : 'Now'}
            {' - '}
            {ticketType.salesEnd ? new Date(ticketType.salesEnd).toLocaleDateString() : 'Event date'}
          </span>
        </div>
      )}
    </div>
  );
}
