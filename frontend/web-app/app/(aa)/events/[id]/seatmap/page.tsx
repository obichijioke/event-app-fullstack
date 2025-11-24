import { Metadata } from 'next';
import { SeatmapPageContent } from '@/components/event-detail/seatmap-page-content';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Select Seats - Event ${id}`,
    description: 'Interactive seatmap for seat selection',
  };
}

export default async function EventSeatmapPage({ params }: Props) {
  const { id } = await params;

  return <SeatmapPageContent eventId={id} />;
}
