import { Prisma, VenueVisibility } from '@prisma/client';

export const venueCatalogEntries = [
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

export const venues = [
  {
    id: 'seed-venue-lagos',
    orgId: 'seed-org-soundwave',
    catalogKey: 'lagosContinental', // Link by key for convenience in seeding logic
    name: 'Lagos Harbour Arena',
    address: {
      line1: '12 Marina Road',
      city: 'Lagos',
      region: 'LA',
      postal: '100001',
      country: 'NG',
    },
    timezone: 'Africa/Lagos',
    capacity: 8000,
    visibility: VenueVisibility.private,
  },
  {
    id: 'seed-venue-abuja',
    orgId: 'seed-org-soundwave',
    catalogKey: 'abujaSummitHall',
    name: 'Abuja Convention Center',
    address: {
      line1: '1 Unity Fountain',
      city: 'Abuja',
      region: 'FC',
      postal: '900211',
      country: 'NG',
    },
    timezone: 'Africa/Lagos',
    capacity: 3500,
    visibility: VenueVisibility.private,
  },
  {
    id: 'seed-venue-accra',
    orgId: 'seed-org-soundwave',
    catalogKey: 'accraGardenTheatre',
    name: 'Accra Arts Pavilion',
    address: {
      line1: '15 Oxford Street',
      city: 'Accra',
      region: 'Greater Accra',
      postal: '00233',
      country: 'GH',
    },
    timezone: 'Africa/Accra',
    capacity: 1200,
    visibility: VenueVisibility.private,
  },
];
