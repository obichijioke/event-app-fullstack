import {
  EventStatus,
  OrgMemberRole,
  Prisma,
  PrismaClient,
  TicketKind,
  Visibility,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedCities } from './seed/cities';
import { users } from './seed/data/users';
import { organizations } from './seed/data/organizations';
import { categories } from './seed/data/categories';
import { venueCatalogEntries, venues } from './seed/data/venues';
import { events } from './seed/data/events';
import { orders } from './seed/data/orders';

const prisma = new PrismaClient();

async function upsertUsers() {
  console.log('  - Seeding users...');
  for (const userData of users) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...data } = userData; // Remove raw password
    const passwordHash = await bcrypt.hash(userData.password, 10);

    await prisma.user.upsert({
      where: { email: data.email },
      update: {
        passwordHash,
        name: data.name,
        role: data.role,
        status: data.status,
      },
      create: {
        ...data,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
  }
}

async function upsertOrganizations() {
  console.log('  - Seeding organizations...');
  for (const orgData of organizations) {
    await prisma.organization.upsert({
      where: { id: orgData.id },
      update: {
        name: orgData.name,
        website: orgData.website,
        country: orgData.country,
        supportEmail: orgData.supportEmail,
        status: orgData.status,
      },
      create: orgData,
    });

    // Ensure owner membership
    await prisma.orgMember.upsert({
      where: {
        orgId_userId: {
          orgId: orgData.id,
          userId: orgData.ownerId,
        },
      },
      update: {
        role: OrgMemberRole.owner,
      },
      create: {
        orgId: orgData.id,
        userId: orgData.ownerId,
        role: OrgMemberRole.owner,
      },
    });
  }
}

async function upsertCategories() {
  console.log('  - Seeding categories...');
  for (const catData of categories) {
    await prisma.category.upsert({
      where: { slug: catData.slug },
      update: { name: catData.name },
      create: catData,
    });
  }
}

async function upsertVenueCatalog() {
  console.log('  - Seeding venue catalog...');
  const result: Record<string, string> = {}; // key -> id map

  for (const { key, record } of venueCatalogEntries) {
    const { id, ...payload } = record;
    await prisma.venueCatalog.upsert({
      where: { id },
      update: payload,
      create: { id, ...payload },
    });
    result[key] = id;
  }
  return result;
}

async function upsertVenues(catalogMap: Record<string, string>) {
  console.log('  - Seeding venues...');
  for (const venueData of venues) {
    const { catalogKey, ...data } = venueData;

    let catalogVenueId: string | undefined;
    if (catalogKey && catalogMap[catalogKey]) {
      catalogVenueId = catalogMap[catalogKey];
    }

    const payload = {
      ...data,
      catalogVenueId,
    };

    await prisma.venue.upsert({
      where: { id: data.id },
      update: {
        name: payload.name,
        address: payload.address,
        timezone: payload.timezone,
        capacity: payload.capacity,
        visibility: payload.visibility,
        catalogVenueId: payload.catalogVenueId,
      },
      create: payload,
    });
  }
}

async function seedEvents() {
  console.log('  - Seeding events...');
  for (const sample of events) {
    const event = await prisma.event.upsert({
      where: { id: sample.id },
      update: {
        title: sample.title,
        shortDescription: sample.shortDescription,
        descriptionMd: sample.description,
        status: EventStatus.live,
        visibility: Visibility.public,
        startAt: sample.startAt,
        endAt: sample.endAt,
        doorTime: sample.doorTime,
        publishAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        coverImageUrl: sample.coverImageUrl,
        language: sample.language ?? 'en',
        latitude: sample.latitude ? new Prisma.Decimal(sample.latitude) : null,
        longitude: sample.longitude
          ? new Prisma.Decimal(sample.longitude)
          : null,
        updatedAt: new Date(),
        venueId: sample.venueId,
        categoryId: sample.categoryId,
        agenda: sample.agenda ?? [],
        speakers: sample.speakers ?? [],
        tags: sample.tags ?? [],
      },
      create: {
        id: sample.id,
        orgId: 'seed-org-soundwave', // Hardcoded for now as per data assumption
        venueId: sample.venueId,
        title: sample.title,
        shortDescription: sample.shortDescription,
        descriptionMd: sample.description,
        status: EventStatus.live,
        visibility: Visibility.public,
        categoryId: sample.categoryId,
        startAt: sample.startAt,
        endAt: sample.endAt,
        doorTime: sample.doorTime,
        publishAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        ageRestriction: '18+',
        coverImageUrl: sample.coverImageUrl,
        language: sample.language ?? 'en',
        latitude: sample.latitude ? new Prisma.Decimal(sample.latitude) : null,
        longitude: sample.longitude
          ? new Prisma.Decimal(sample.longitude)
          : null,
        agenda: sample.agenda ?? [],
        speakers: sample.speakers ?? [],
        tags: sample.tags ?? [],
      },
    });

    await prisma.eventOccurrence.upsert({
      where: { id: `${event.id}-occurrence` },
      update: {
        startsAt: sample.startAt,
        endsAt: sample.endAt,
      },
      create: {
        id: `${event.id}-occurrence`,
        eventId: event.id,
        startsAt: sample.startAt,
        endsAt: sample.endAt,
        gateOpenAt: sample.doorTime,
      },
    });

    await prisma.eventPolicies.upsert({
      where: { eventId: event.id },
      update: {
        refundPolicy: sample.policies.refundPolicy,
        transferAllowed: sample.policies.transferAllowed ?? true,
        resaleAllowed: sample.policies.resaleAllowed ?? false,
        transferCutoff: sample.policies.transferCutoff ?? '2 hours',
      },
      create: {
        eventId: event.id,
        refundPolicy: sample.policies.refundPolicy,
        transferAllowed: sample.policies.transferAllowed ?? true,
        resaleAllowed: sample.policies.resaleAllowed ?? false,
        transferCutoff: sample.policies.transferCutoff ?? '2 hours',
      },
    });

    for (const ticket of sample.ticketTypes) {
      await prisma.ticketType.upsert({
        where: { id: ticket.id },
        update: {
          name: ticket.name,
          priceCents: ticket.priceCents,
          feeCents: ticket.feeCents,
          capacity: ticket.capacity,
          salesStart: ticket.salesStart,
          salesEnd: ticket.salesEnd,
          kind: ticket.kind ?? TicketKind.GA,
          status: 'active',
        },
        create: {
          id: ticket.id,
          eventId: event.id,
          name: ticket.name,
          kind: ticket.kind ?? TicketKind.GA,
          currency: 'NGN',
          priceCents: ticket.priceCents,
          feeCents: ticket.feeCents,
          capacity: ticket.capacity,
          perOrderLimit: 6,
          salesStart: ticket.salesStart,
          salesEnd: ticket.salesEnd,
          status: 'active',
        },
      });
    }
  }
}

async function upsertOrders(orgId: string) {
  console.log('  - Seeding orders & tickets...');
  for (const orderData of orders) {
    const createdOrder = await prisma.order.upsert({
      where: { id: orderData.orderId },
      update: {
        status: orderData.status,
        totalCents: orderData.totalCents,
        subtotalCents: orderData.subtotalCents,
        feesCents: orderData.feesCents,
      },
      create: {
        id: orderData.orderId,
        buyerId: orderData.buyerId,
        orgId: orgId,
        eventId: orderData.eventId,
        status: orderData.status,
        currency: 'NGN',
        totalCents: orderData.totalCents,
        subtotalCents: orderData.subtotalCents,
        feesCents: orderData.feesCents,
        taxCents: 0,
      },
    });

    for (const item of orderData.items) {
      const count = await prisma.orderItem.count({
        where: { orderId: createdOrder.id, ticketTypeId: item.ticketTypeId },
      });
      if (count === 0) {
        await prisma.orderItem.create({
          data: {
            orderId: createdOrder.id,
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            unitFeeCents: item.unitFeeCents,
            currency: 'NGN',
          },
        });
      }
    }

    for (const t of orderData.tickets) {
      for (let i = 0; i < t.quantity; i++) {
        const ticketCount = await prisma.ticket.count({
          where: {
            orderId: createdOrder.id,
            ticketTypeId: t.ticketTypeId,
          },
        });

        if (ticketCount < t.quantity) {
          await prisma.ticket.create({
            data: {
              orderId: createdOrder.id,
              eventId: orderData.eventId,
              ticketTypeId: t.ticketTypeId,
              ownerId: orderData.buyerId,
              status: 'issued',
              qrCode: `seed-qr-${orderData.orderId}-${t.ticketTypeId}-${i}`,
            },
          });
        }
      }
    }

    await prisma.payment.upsert({
      where: {
        provider_providerCharge: {
          provider: orderData.payment.provider,
          providerCharge: orderData.payment.reference,
        },
      },
      update: {
        status: orderData.payment.status,
      },
      create: {
        orderId: createdOrder.id,
        provider: orderData.payment.provider,
        providerCharge: orderData.payment.reference,
        status: orderData.payment.status,
        amountCents: orderData.payment.amountCents,
        currency: 'NGN',
      },
    });
  }
}

async function main() {
  console.log('🌱 Seeding database...');

  await upsertUsers();
  await upsertOrganizations();
  await upsertCategories();
  const catalogMap = await upsertVenueCatalog();
  await upsertVenues(catalogMap);
  await seedEvents();
  await upsertOrders('seed-org-soundwave');
  await seedCities();

  console.log('✅ Seed data ready. Organizer credentials:');
  console.log('   Email: organizer@eventflow.dev');
  console.log(
    `   Password: ${process.env.SEED_USER_PASSWORD ?? 'Password123!'}`,
  );
  console.log('   Attendee credentials:');
  console.log('   Email: attendee@eventflow.dev');
}

main()
  .catch((error) => {
    console.error('❌ Failed to seed database', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
