import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CreateSeatmapForm } from '@/components/organizer/seatmaps/create-seatmap-form';

export const metadata: Metadata = {
  title: 'Create Seatmap',
  description: 'Create a new seatmap',
};

export default function CreateSeatmapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/organizer/seatmaps"
          className="p-2 hover:bg-secondary rounded-md transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Seatmap</h1>
          <p className="text-muted-foreground mt-1">Design a seating layout for your venue</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <CreateSeatmapForm />
      </Suspense>
    </div>
  );
}
