'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Armchair, X } from 'lucide-react';

interface Seat {
  id: string;
  row: string;
  number: number;
  section: string;
  status: 'available' | 'unavailable' | 'selected';
  priceCents: number;
}

interface InteractiveSeatmapProps {
  eventId: string;
  onSeatsChange?: (seats: Seat[]) => void;
}

// Mock seat data - in production this would come from the API
const generateMockSeats = (): Seat[] => {
  const seats: Seat[] = [];
  const sections = ['VIP', 'Premium', 'Regular'];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsPerRow = 12;

  sections.forEach((section, sectionIndex) => {
    rows.forEach((row, rowIndex) => {
      for (let i = 1; i <= seatsPerRow; i++) {
        // Random unavailable seats for demo
        const isUnavailable = Math.random() < 0.3;

        seats.push({
          id: `${section}-${row}-${i}`,
          row,
          number: i,
          section,
          status: isUnavailable ? 'unavailable' : 'available',
          priceCents: sectionIndex === 0 ? 50000 : sectionIndex === 1 ? 30000 : 15000,
        });
      }
    });
  });

  return seats;
};

export function InteractiveSeatmap({ eventId, onSeatsChange }: InteractiveSeatmapProps) {
  const [seats, setSeats] = useState<Seat[]>(generateMockSeats());
  const [selectedSection, setSelectedSection] = useState<string>('VIP');

  const sections = ['VIP', 'Premium', 'Regular'];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsPerRow = 12;

  const toggleSeat = (seatId: string) => {
    setSeats((prev) => {
      const updated = prev.map((seat) => {
        if (seat.id === seatId && seat.status !== 'unavailable') {
          return {
            ...seat,
            status: seat.status === 'selected' ? 'available' : 'selected',
          } as Seat;
        }
        return seat;
      });

      // Notify parent of selection change
      const selectedSeats = updated.filter((s) => s.status === 'selected');
      onSeatsChange?.(selectedSeats);

      return updated;
    });
  };

  const getSectionSeats = (section: string) => {
    return seats.filter((seat) => seat.section === section);
  };

  const getSeat = (section: string, row: string, number: number): Seat | undefined => {
    return seats.find((s) => s.section === section && s.row === row && s.number === number);
  };

  const selectedSeats = seats.filter((s) => s.status === 'selected');
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.priceCents, 0);

  return (
    <div className="space-y-6">
      {/* Section Selector */}
      <div className="flex gap-2 justify-center">
        {sections.map((section) => {
          const sectionSeats = getSectionSeats(section);
          const available = sectionSeats.filter((s) => s.status === 'available').length;
          const selected = sectionSeats.filter((s) => s.status === 'selected').length;

          return (
            <button
              key={section}
              onClick={() => setSelectedSection(section)}
              className={cn(
                'px-6 py-3 rounded-lg border-2 transition-all',
                selectedSection === section
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div>
                <p className="font-medium">{section}</p>
                <p className="text-xs text-muted-foreground">
                  {available} available {selected > 0 && `• ${selected} selected`}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage */}
      <div className="bg-gradient-to-b from-primary/20 to-primary/5 rounded-lg py-4 text-center border-2 border-primary/30">
        <p className="text-sm font-semibold text-foreground">STAGE</p>
      </div>

      {/* Seatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-2 mb-2">
              {/* Row Label */}
              <div className="w-8 text-center font-semibold text-sm text-muted-foreground">
                {row}
              </div>

              {/* Seats */}
              <div className="flex gap-1 flex-1 justify-center">
                {Array.from({ length: seatsPerRow }, (_, i) => i + 1).map((number) => {
                  const seat = getSeat(selectedSection, row, number);

                  if (!seat) {
                    return <div key={number} className="w-8 h-8" />;
                  }

                  // Aisle space
                  if (number === seatsPerRow / 2) {
                    return (
                      <div key={`${number}-spacer`} className="flex gap-1">
                        <SeatButton seat={seat} onClick={() => toggleSeat(seat.id)} />
                        <div className="w-4" />
                      </div>
                    );
                  }

                  return (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      onClick={() => toggleSeat(seat.id)}
                    />
                  );
                })}
              </div>

              {/* Row Label (right side) */}
              <div className="w-8 text-center font-semibold text-sm text-muted-foreground">
                {row}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 border-2 border-green-600 rounded flex items-center justify-center">
            <Armchair className="h-4 w-4 text-green-700" />
          </div>
          <span className="text-sm font-medium">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 border-2 border-blue-600 rounded flex items-center justify-center">
            <Armchair className="h-4 w-4 text-blue-700" />
          </div>
          <span className="text-sm font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 border-2 border-gray-400 rounded flex items-center justify-center">
            <Armchair className="h-4 w-4 text-gray-500" />
          </div>
          <span className="text-sm font-medium">Unavailable</span>
        </div>
      </div>
    </div>
  );
}

interface SeatButtonProps {
  seat: Seat;
  onClick: () => void;
}

function SeatButton({ seat, onClick }: SeatButtonProps) {
  const getStyle = () => {
    switch (seat.status) {
      case 'selected':
        return 'bg-blue-100 border-blue-600 hover:bg-blue-200 cursor-pointer';
      case 'available':
        return 'bg-green-100 border-green-600 hover:bg-green-200 cursor-pointer';
      case 'unavailable':
        return 'bg-gray-200 border-gray-400 cursor-not-allowed opacity-50';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={seat.status === 'unavailable'}
      className={cn(
        'w-8 h-8 rounded border-2 transition-all flex items-center justify-center group relative',
        getStyle()
      )}
      title={`${seat.section} - Row ${seat.row}, Seat ${seat.number} - ₦${(seat.priceCents / 100).toLocaleString()}`}
    >
      <Armchair
        className={cn(
          'h-4 w-4',
          seat.status === 'selected' && 'text-blue-700',
          seat.status === 'available' && 'text-green-700',
          seat.status === 'unavailable' && 'text-gray-500'
        )}
      />
    </button>
  );
}

interface SeatSelectionSummaryProps {
  seats: Seat[];
  onRemoveSeat: (seatId: string) => void;
  onCheckout: () => void;
}

export function SeatSelectionSummary({ seats, onRemoveSeat, onCheckout }: SeatSelectionSummaryProps) {
  const totalPrice = seats.reduce((sum, seat) => sum + seat.priceCents, 0);

  if (seats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No seats selected</p>
        <p className="text-xs text-muted-foreground mt-2">Click on available seats to select them</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {seats.map((seat) => (
          <div
            key={seat.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">
                {seat.section} - Row {seat.row}, Seat {seat.number}
              </p>
              <p className="text-xs text-muted-foreground">
                ₦{(seat.priceCents / 100).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => onRemoveSeat(seat.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex justify-between mb-4">
          <span className="font-medium">Total ({seats.length} seat{seats.length !== 1 ? 's' : ''})</span>
          <span className="font-bold text-lg">
            ₦{(totalPrice / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}
          </span>
        </div>
        <Button onClick={onCheckout} className="w-full" size="lg">
          Continue to Checkout
        </Button>
      </div>
    </div>
  );
}
