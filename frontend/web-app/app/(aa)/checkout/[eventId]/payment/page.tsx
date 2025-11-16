import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ orderId?: string }>;
};

export default async function OldPaymentRedirect({ params, searchParams }: Props) {
  const { eventId } = await params;
  const { orderId } = await searchParams;

  // Redirect to the new payment path with order ID if present
  const url = orderId
    ? `/events/${eventId}/checkout/payment?orderId=${orderId}`
    : `/events/${eventId}/checkout`;

  redirect(url);
}
