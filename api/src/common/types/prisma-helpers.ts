import { Prisma } from '@prisma/client';

/**
 * Reusable Prisma query configurations for email-related operations
 * These use Prisma.validator to ensure type safety
 */

// Order with all relations needed for email sending
export const orderEmailIncludes = Prisma.validator<Prisma.OrderDefaultArgs>()({
  include: {
    event: {
      select: {
        id: true,
        title: true,
        startAt: true,
        policies: true,
        venue: {
          select: {
            name: true,
            address: true,
          },
        },
        org: {
          select: {
            id: true,
            name: true,
            supportEmail: true,
          },
        },
      },
    },
    occurrence: {
      select: {
        startsAt: true,
      },
    },
    items: {
      include: {
        ticketType: {
          select: {
            name: true,
          },
        },
      },
    },
    payments: {
      select: {
        provider: true,
      },
    },
    tickets: {
      include: {
        ticketType: {
          select: {
            name: true,
          },
        },
        seat: {
          select: {
            section: true,
            row: true,
            number: true,
          },
        },
      },
    },
  },
});

export type OrderWithEmailData = Prisma.OrderGetPayload<
  typeof orderEmailIncludes
>;

// Refund with order and event data
export const refundEmailIncludes = Prisma.validator<Prisma.RefundDefaultArgs>()(
  {
    include: {
      order: {
        include: {
          event: {
            include: {
              org: {
                select: {
                  supportEmail: true,
                },
              },
            },
          },
          payments: {
            select: {
              provider: true,
            },
            take: 1,
          },
          items: {
            include: {
              ticketType: {
                select: {
                  name: true,
                },
              },
              seat: {
                select: {
                  section: true,
                  row: true,
                  number: true,
                },
              },
            },
          },
        },
      },
    },
  },
);

export type RefundWithEmailData = Prisma.RefundGetPayload<
  typeof refundEmailIncludes
>;

// Transfer with ticket, users, and event data
export const transferEmailIncludes =
  Prisma.validator<Prisma.TransferDefaultArgs>()({
    include: {
      toUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      fromUser: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      ticket: {
        include: {
          ticketType: {
            select: {
              name: true,
            },
          },
          seat: {
            select: {
              section: true,
              row: true,
              number: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              startAt: true,
              venue: {
                select: {
                  name: true,
                  address: true,
                },
              },
            },
          },
        },
      },
    },
  });

export type TransferWithEmailData = Prisma.TransferGetPayload<
  typeof transferEmailIncludes
>;
