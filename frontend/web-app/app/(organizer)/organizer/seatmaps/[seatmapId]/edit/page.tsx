import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditSeatmapForm } from '@/components/organizer/seatmaps/edit-seatmap-form';

type Props = {
  params: Promise<{ seatmapId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seatmapId } = await params;
  return {
    title: `Edit Seatmap`,
    description: 'Edit seatmap layout',
  };
}

export default async function EditSeatmapPage({ params }: Props) {
  const { seatmapId } = await params;

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
          <h1 className="text-3xl font-bold">Edit Seatmap</h1>
          <p className="text-muted-foreground mt-1">Modify seating layout and properties</p>
        </div>
      </div>

      <EditSeatmapForm seatmapId={seatmapId} />
    </div>
  );
}
