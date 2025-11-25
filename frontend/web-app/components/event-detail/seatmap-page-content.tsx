'use client';

import { useState } from 'react';
import { InteractiveSeatmap, SeatSelectionSummary } from './interactive-seatmap';

interface Seat {
  id: string;
  row: string;
  number: number;
  section: string;
  status: 'available' | 'unavailable' | 'selected';
  priceCents: number;
}

interface SeatmapPageContentProps {
  eventId: string;
}

export function SeatmapPageContent({ eventId }: SeatmapPageContentProps) {
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  const handleSeatsChange = (seats: Seat[]) => {
    setSelectedSeats(seats);
  };

  const handleRemoveSeat = (seatId: string) => {
    setSelectedSeats((prev) => prev.filter((seat) => seat.id !== seatId));
  };

  const handleCheckout = () => {
    // Navigate to checkout with selected seats
    console.log('Checkout with seats:', selectedSeats);
    // TODO: Navigate to checkout page
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Select Your Seats</h1>
        <p className="text-muted-foreground">
          Choose your preferred seats from the interactive seatmap below
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Seatmap Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg p-6 shadow-card">
            <InteractiveSeatmap eventId={eventId} onSeatsChange={handleSeatsChange} />
          </div>
        </div>

        {/* Selection Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg p-6 shadow-card sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Your Selection</h2>
            <SeatSelectionSummary
              seats={selectedSeats}
              onRemoveSeat={handleRemoveSeat}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
