import { Metadata } from "next";
import { AdminEventDetail } from "@/components/admin/events/event-detail";

type Props = {
  // Use Promise-wrapped params to match Next's PageProps expectation
  params?: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const eventId = resolved?.eventId ?? "";
  return {
    title: `Event ${eventId} — Admin`,
    description: `Admin view for event ${eventId}`,
  };
}

export default async function EventDetailPage({ params }: Props) {
  const resolved = await params;
  const eventId = resolved?.eventId;

  if (!eventId) {
    return <div className="p-6">Invalid event ID</div>;
  }

  return <AdminEventDetail eventId={eventId} />;
}
