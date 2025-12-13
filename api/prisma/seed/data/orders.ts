import { OrderStatus, PaymentStatus } from '@prisma/client';

export const orders = [
  {
    orderId: 'seed-order-attendee1-lagos',
    buyerId: 'seed-user-attendee-1',
    eventId: 'seed-event-lagos-soundfest',
    status: OrderStatus.paid,
    tickets: [
      {
        ticketTypeId: 'seed-ticket-lagos-ga',
        quantity: 2,
        priceCents: BigInt(25000),
        feeCents: BigInt(1500),
      },
    ],
    items: [
      {
        ticketTypeId: 'seed-ticket-lagos-ga',
        quantity: 2,
        unitPriceCents: BigInt(25000),
        unitFeeCents: BigInt(1500),
      },
    ],
    totalCents: BigInt(53000), // (25000 + 1500) * 2
    subtotalCents: BigInt(50000),
    feesCents: BigInt(3000),
    payment: {
      provider: 'stripe',
      status: PaymentStatus.captured,
      amountCents: BigInt(53000),
      reference: 'pi_seed_checkout_1',
    },
  },
  {
    orderId: 'seed-order-attendee2-abuja',
    buyerId: 'seed-user-attendee-2',
    eventId: 'seed-event-abuja-tech-summit',
    status: OrderStatus.paid,
    tickets: [
      {
        ticketTypeId: 'seed-ticket-abuja-standard',
        quantity: 1,
        priceCents: BigInt(45000),
        feeCents: BigInt(2000),
      },
    ],
    items: [
      {
        ticketTypeId: 'seed-ticket-abuja-standard',
        quantity: 1,
        unitPriceCents: BigInt(45000),
        unitFeeCents: BigInt(2000),
      },
    ],
    totalCents: BigInt(47000),
    subtotalCents: BigInt(45000),
    feesCents: BigInt(2000),
    payment: {
      provider: 'stripe',
      status: PaymentStatus.captured,
      amountCents: BigInt(47000),
      reference: 'pi_seed_checkout_2',
    },
  },
];
