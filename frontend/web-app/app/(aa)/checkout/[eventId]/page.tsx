import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ eventId: string }>;
};

export default async function OldCheckoutRedirect({ params }: Props) {
  const { eventId } = await params;
  // Redirect to the new checkout path (note: new path uses [id] parameter)
  redirect(`/events/${eventId}/checkout`);
}
