import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SeatmapList } from '@/components/organizer/seatmaps/seatmap-list';

export const metadata: Metadata = {
  title: 'Seatmaps',
  description: 'Manage seatmaps',
};

export default function SeatmapsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/organizer"
          className="p-2 hover:bg-secondary rounded-md transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Seatmaps</h1>
          <p className="text-muted-foreground mt-1">Create and manage seating layouts for your venues</p>
        </div>
      </div>

      <SeatmapList />
    </div>
  );
}
