import {
  EventStatus,
  OrgMemberRole,
  PlatformRole,
  Prisma,
  PrismaClient,
  TicketKind,
  VenueCatalog,
  Visibility,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedCities } from './seed/cities';

const prisma = new PrismaClient();

type SampleEventInput = {
  id: string;
  title: string;
  description: string;
  venueId: string;
  categoryId: string;
  startAt: Date;
  endAt: Date;
  doorTime: Date;
  coverImageUrl: string;
  language?: string;
  latitude?: number;
  longitude?: number;
  ticketTypes: Array<{
    id: string;
    name: string;
    priceCents: bigint;
    feeCents: bigint;
    capacity: number;
    salesStart: Date;
    salesEnd: Date;
    kind?: TicketKind;
  }>;
  policies: {
    refundPolicy?: string;
    transferAllowed?: boolean;
    resaleAllowed?: boolean;
    transferCutoff?: string | null;
  };
};

async function upsertUser() {
  const email = 'organizer@eventflow.dev';
  const password = process.env.SEED_USER_PASSWORD ?? 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name: 'Seed Organizer',
      role: PlatformRole.organizer,
      status: 'active',
    },
    create: {
      id: 'seed-user-organizer',
      email,
      passwordHash,
      name: 'Seed Organizer',
      phone: '+2348000000000',
      role: PlatformRole.organizer,
      status: 'active',
      emailVerifiedAt: new Date(),
    },
  });

  return user;
}

async function upsertOrganization(ownerId: string) {
  const org = await prisma.organization.upsert({
    where: { id: 'seed-org-soundwave' },
    update: {
      name: 'Soundwave Collective',
      website: 'https://soundwave.example.com',
      country: 'NG',
      supportEmail: 'support@soundwave.example.com',
      status: 'approved',
    },
    create: {
      id: 'seed-org-soundwave',
      ownerId,
      name: 'Soundwave Collective',
      legalName: 'Soundwave Collective LTD',
      website: 'https://soundwave.example.com',
      country: 'NG',
      supportEmail: 'support@soundwave.example.com',
      status: 'approved',
    },
  });

  await prisma.orgMember.upsert({
    where: {
      orgId_userId: {
        orgId: org.id,
        userId: ownerId,
      },
    },
    update: {
      role: OrgMemberRole.owner,
    },
    create: {
      orgId: org.id,
      userId: ownerId,
      role: OrgMemberRole.owner,
    },
  });

  return org;
}

async function upsertCategories() {
  const music = await prisma.category.upsert({
    where: { slug: 'music' },
    update: {
      name: 'Music',
    },
    create: {
      id: 'seed-category-music',
      slug: 'music',
      name: 'Music',
    },
  });

  const tech = await prisma.category.upsert({
    where: { slug: 'tech' },
    update: {
      name: 'Tech & Innovation',
    },
    create: {
      id: 'seed-category-tech',
      slug: 'tech',
      name: 'Tech & Innovation',
    },
  });

  const culture = await prisma.category.upsert({
    where: { slug: 'culture' },
    update: {
      name: 'Culture & Lifestyle',
    },
    create: {
      id: 'seed-category-culture',
      slug: 'culture',
      name: 'Culture & Lifestyle',
    },
  });

  return { music, tech, culture };
}

type CatalogSeedKey =
  | 'lagosContinental'
  | 'abujaSummitHall'
  | 'accraGardenTheatre';

type CatalogSeedResult = Record<CatalogSeedKey, VenueCatalog>;

async function upsertVenueCatalog(): Promise<CatalogSeedResult> {
  const entries: Array<{
    key: CatalogSeedKey;
    record: {
      id: string;
      slug: string;
      name: string;
      description: string;
      imageUrl: string;
      address: Prisma.JsonObject;
      timezone: string;
      capacityMin: number;
      capacityMax: number;
      latitude: Prisma.Decimal;
      longitude: Prisma.Decimal;
      tags: string[];
      defaultSeatmapSpec: Prisma.JsonObject;
    };
  }> = [
    {
      key: 'lagosContinental',
      record: {
        id: 'catalog-venue-lagos-continental',
        slug: 'lagos-continental-arena',
        name: 'Lagos Continental Arena',
        description:
          'Waterfront multi-purpose indoor arena suited for arena tours, sports, and large conferences.',
        imageUrl:
          'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
        address: {
          line1: '1 Eko Atlantic Drive',
          city: 'Lagos',
          region: 'LA',
          postal: '100001',
          country: 'NG',
        },
        timezone: 'Africa/Lagos',
        capacityMin: 5000,
        capacityMax: 20000,
        latitude: new Prisma.Decimal('6.4147'),
        longitude: new Prisma.Decimal('3.4095'),
        tags: ['arena', 'concert', 'sports'],
        defaultSeatmapSpec: {
          template: 'endstage',
          sections: [
            { name: 'Floor', capacity: 7000 },
            { name: 'Lower Bowl', capacity: 8000 },
            { name: 'Upper Bowl', capacity: 3000 },
            { name: 'Suites', capacity: 2000 },
          ],
        } as Prisma.JsonObject,
      },
    },
    {
      key: 'abujaSummitHall',
      record: {
        id: 'catalog-venue-abuja-summit',
        slug: 'abuja-summit-hall',
        name: 'Abuja Summit Hall',
        description:
          'Flexible summit center in the Central Business District with divisible halls and broadcast infrastructure.',
        imageUrl:
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
        address: {
          line1: '100 Conference Avenue',
          city: 'Abuja',
          region: 'FC',
          postal: '900211',
          country: 'NG',
        },
        timezone: 'Africa/Lagos',
        capacityMin: 1200,
        capacityMax: 6000,
        latitude: new Prisma.Decimal('9.0600'),
        longitude: new Prisma.Decimal('7.4893'),
        tags: ['conference', 'summit', 'hybrid'],
        defaultSeatmapSpec: {
          template: 'conference-tiered',
          sections: [
            { name: 'Grand Hall', capacity: 2400 },
            { name: 'Gallery', capacity: 900 },
            { name: 'Breakout East', capacity: 800 },
            { name: 'Breakout West', capacity: 900 },
          ],
        } as Prisma.JsonObject,
      },
    },
    {
      key: 'accraGardenTheatre',
      record: {
        id: 'catalog-venue-accra-garden',
        slug: 'accra-garden-theatre',
        name: 'Accra Garden Amphitheatre',
        description:
          'Open-air amphitheatre surrounded by tropical gardens, ideal for cultural nights and boutique festivals.',
        imageUrl:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        address: {
          line1: '15 Independence Avenue',
          city: 'Accra',
          region: 'Greater Accra',
          postal: '00233',
          country: 'GH',
        },
        timezone: 'Africa/Accra',
        capacityMin: 800,
        capacityMax: 4500,
        latitude: new Prisma.Decimal('5.5593'),
        longitude: new Prisma.Decimal('-0.1977'),
        tags: ['outdoor', 'culture', 'market'],
        defaultSeatmapSpec: {
          template: 'amphitheatre',
          zones: [
            { name: 'Stagefront', capacity: 1200 },
            { name: 'Terraces', capacity: 2000 },
            { name: 'Garden Walks', capacity: 1300 },
          ],
        } as Prisma.JsonObject,
      },
    },
  ];

  const result: Partial<CatalogSeedResult> = {};

  for (const { key, record } of entries) {
    const { id, ...payload } = record;
    result[key] = await prisma.venueCatalog.upsert({
      where: { id },
      update: payload,
      create: { id, ...payload },
    });
  }

  return result as CatalogSeedResult;
}

async function upsertVenues(orgId: string, catalog?: CatalogSeedResult) {
  const lagosCatalogId = catalog?.lagosContinental?.id;
  const lagosArena = await prisma.venue.upsert({
    where: { id: 'seed-venue-lagos' },
    update: {
      name: 'Lagos Harbour Arena',
      address: lagosAddress(),
      timezone: 'Africa/Lagos',
      capacity: 8000,
      ...(lagosCatalogId ? { catalogVenueId: lagosCatalogId } : {}),
    },
    create: {
      id: 'seed-venue-lagos',
      orgId,
      name: 'Lagos Harbour Arena',
      address: lagosAddress(),
      timezone: 'Africa/Lagos',
      capacity: 8000,
      ...(lagosCatalogId ? { catalogVenueId: lagosCatalogId } : {}),
    },
  });

  const abujaCatalogId = catalog?.abujaSummitHall?.id;
  const abujaCenter = await prisma.venue.upsert({
    where: { id: 'seed-venue-abuja' },
    update: {
      name: 'Abuja Convention Center',
      address: abujaAddress(),
      timezone: 'Africa/Lagos',
      capacity: 3500,
      ...(abujaCatalogId ? { catalogVenueId: abujaCatalogId } : {}),
    },
    create: {
      id: 'seed-venue-abuja',
      orgId,
      name: 'Abuja Convention Center',
      address: abujaAddress(),
      timezone: 'Africa/Lagos',
      capacity: 3500,
      ...(abujaCatalogId ? { catalogVenueId: abujaCatalogId } : {}),
    },
  });

  const accraCatalogId = catalog?.accraGardenTheatre?.id;
  const accraGallery = await prisma.venue.upsert({
    where: { id: 'seed-venue-accra' },
    update: {
      name: 'Accra Arts Pavilion',
      address: accraAddress(),
      timezone: 'Africa/Accra',
      capacity: 1200,
      ...(accraCatalogId ? { catalogVenueId: accraCatalogId } : {}),
    },
    create: {
      id: 'seed-venue-accra',
      orgId,
      name: 'Accra Arts Pavilion',
      address: accraAddress(),
      timezone: 'Africa/Accra',
      capacity: 1200,
      ...(accraCatalogId ? { catalogVenueId: accraCatalogId } : {}),
    },
  });

  return { lagosArena, abujaCenter, accraGallery };
}

function lagosAddress(): Prisma.JsonObject {
  return {
    line1: '12 Marina Road',
    city: 'Lagos',
    region: 'LA',
    postal: '100001',
    country: 'NG',
  };
}

function abujaAddress(): Prisma.JsonObject {
  return {
    line1: '1 Unity Fountain',
    city: 'Abuja',
    region: 'FC',
    postal: '900211',
    country: 'NG',
  };
}

function accraAddress(): Prisma.JsonObject {
  return {
    line1: '15 Oxford Street',
    city: 'Accra',
    region: 'Greater Accra',
    postal: '00233',
    country: 'GH',
  };
}

async function seedEvents(orgId: string, samples: SampleEventInput[]) {
  for (const sample of samples) {
    const event = await prisma.event.upsert({
      where: { id: sample.id },
      update: {
        title: sample.title,
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
      },
      create: {
        id: sample.id,
        orgId,
        venueId: sample.venueId,
        title: sample.title,
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
          status: 'approved',
        },
      });
    }
  }
}

function daysFromNow(days: number, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function eventSamples(
  venues: Awaited<ReturnType<typeof upsertVenues>>,
  categories: Awaited<ReturnType<typeof upsertCategories>>,
): SampleEventInput[] {
  const now = new Date();
  return [
    {
      id: 'seed-event-lagos-soundfest',
      title: 'Lagos Sound Fest',
      description:
        'An outdoor celebration of Afrobeats and amapiano featuring live performances, immersive art, and curated food vendors.',
      venueId: venues.lagosArena.id,
      categoryId: categories.music.id,
      startAt: daysFromNow(5, 19),
      endAt: daysFromNow(5, 23),
      doorTime: daysFromNow(5, 18),
      coverImageUrl:
        'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=1600&q=80',
      language: 'en',
      latitude: 6.5244,
      longitude: 3.3792,
      ticketTypes: [
        {
          id: 'seed-ticket-lagos-ga',
          name: 'General Admission',
          priceCents: BigInt(25000),
          feeCents: BigInt(1500),
          capacity: 3000,
          salesStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          salesEnd: daysFromNow(4, 23),
        },
        {
          id: 'seed-ticket-lagos-vip',
          name: 'VIP Terrace',
          priceCents: BigInt(60000),
          feeCents: BigInt(2500),
          capacity: 250,
          salesStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          salesEnd: daysFromNow(4, 23),
        },
      ],
      policies: {
        refundPolicy:
          'Full refunds are available up to 72 hours before the show.',
        transferAllowed: true,
        resaleAllowed: true,
        transferCutoff: '3 hours',
      },
    },
    {
      id: 'seed-event-abuja-tech-summit',
      title: 'Abuja Future of Tech Summit',
      description:
        'A two-day summit covering AI, fintech, and creative technology with hands-on labs and investor office hours.',
      venueId: venues.abujaCenter.id,
      categoryId: categories.tech.id,
      startAt: daysFromNow(12, 9),
      endAt: daysFromNow(13, 17),
      doorTime: daysFromNow(12, 8),
      coverImageUrl:
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
      language: 'en',
      latitude: 9.0765,
      longitude: 7.3986,
      ticketTypes: [
        {
          id: 'seed-ticket-abuja-standard',
          name: 'Standard Pass',
          priceCents: BigInt(45000),
          feeCents: BigInt(2000),
          capacity: 1200,
          salesStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          salesEnd: daysFromNow(11, 18),
        },
        {
          id: 'seed-ticket-abuja-founder',
          name: 'Founder Track',
          priceCents: BigInt(90000),
          feeCents: BigInt(3500),
          capacity: 300,
          salesStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          salesEnd: daysFromNow(11, 18),
        },
      ],
      policies: {
        refundPolicy:
          'Tickets are refundable up to 7 days before day 1. Transfers allowed until 24 hours before check-in.',
        transferAllowed: true,
        resaleAllowed: false,
        transferCutoff: '24 hours',
      },
    },
    {
      id: 'seed-event-accra-art-night',
      title: 'Accra Night Market & Art Walk',
      description:
        'Curated evening market featuring emerging designers, live muralists, and intimate acoustic sets along Oxford Street.',
      venueId: venues.accraGallery.id,
      categoryId: categories.culture.id,
      startAt: daysFromNow(3, 17),
      endAt: daysFromNow(3, 22),
      doorTime: daysFromNow(3, 16),
      coverImageUrl:
        'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1600&q=80',
      language: 'en',
      latitude: 5.6037,
      longitude: -0.187,
      ticketTypes: [
        {
          id: 'seed-ticket-accra-market',
          name: 'Market Pass',
          priceCents: BigInt(15000),
          feeCents: BigInt(800),
          capacity: 800,
          salesStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          salesEnd: daysFromNow(2, 22),
        },
      ],
      policies: {
        refundPolicy:
          'Non-refundable, but you may transfer your pass up to 6 hours before gates open.',
        transferAllowed: true,
        resaleAllowed: false,
        transferCutoff: '6 hours',
      },
    },
  ];
}

async function main() {
  console.log('🌱 Seeding database with sample events...');

  const user = await upsertUser();
  const org = await upsertOrganization(user.id);
  const categories = await upsertCategories();
  const catalog = await upsertVenueCatalog();
  const venues = await upsertVenues(org.id, catalog);
  const samples = eventSamples(venues, categories);

  await seedEvents(org.id, samples);

  // Seed geographic data
  await seedCities();

  console.log('✅ Seed data ready. Organizer credentials:');
  console.log('   Email: organizer@eventflow.dev');
  console.log(
    `   Password: ${process.env.SEED_USER_PASSWORD ?? 'Password123!'}`,
  );
}

main()
  .catch((error) => {
    console.error('❌ Failed to seed database', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
