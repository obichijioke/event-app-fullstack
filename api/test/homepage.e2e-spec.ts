import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RedisService } from '../src/common/redis/redis.service';

describe('HomepageController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaMock: {
    event: { findMany: jest.Mock };
    category: { findMany: jest.Mock };
    organization: { findMany: jest.Mock };
    userFollow: { findMany: jest.Mock };
    order: { findMany: jest.Mock };
  };
  let redisMock: {
    get: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      event: { findMany: jest.fn().mockResolvedValue([]) },
      category: { findMany: jest.fn().mockResolvedValue([]) },
      organization: { findMany: jest.fn().mockResolvedValue([]) },
      userFollow: { findMany: jest.fn().mockResolvedValue([]) },
      order: { findMany: jest.fn().mockResolvedValue([]) },
    };

    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisService)
      .useValue(redisMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns an empty homepage payload when no records exist', async () => {
    const response = await request(app.getHttpServer())
      .get('/homepage')
      .expect(200);

    expect(response.body.hero).toBeNull();
    expect(Array.isArray(response.body.sections)).toBe(true);
    expect(response.body.sections).toHaveLength(0);
    expect(response.body.organizers).toHaveLength(0);
    expect(redisMock.get).toHaveBeenCalled();
    expect(redisMock.set).toHaveBeenCalled();
  });

  it('includes hero and trending sections when events are returned', async () => {
    const mockEvent: any = {
      id: 'evt_1',
      orgId: 'org_1',
      title: 'Sunset Sessions',
      descriptionMd: 'Live music at the waterfront',
      status: 'live',
      visibility: 'public',
      categoryId: 'cat_1',
      startAt: new Date('2025-11-01T02:00:00.000Z'),
      endAt: new Date('2025-11-01T05:00:00.000Z'),
      doorTime: new Date('2025-11-01T01:00:00.000Z'),
      publishAt: new Date('2025-10-01T00:00:00.000Z'),
      ageRestriction: null,
      coverImageUrl: 'https://example.com/cover.jpg',
      language: 'en',
      latitude: null,
      longitude: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      org: {
        id: 'org_1',
        name: 'Sunset Live',
      },
      venue: {
        id: 'venue_1',
        name: 'Waterfront Hall',
        address: {
          city: 'Austin',
          region: 'TX',
          country: 'USA',
        },
        timezone: 'America/Chicago',
      },
      category: {
        id: 'cat_1',
        name: 'Music',
        slug: 'music',
      },
      seatmap: null,
      eventSeatmaps: [],
      promoCodes: [],
      assets: [],
      policies: {
        eventId: 'evt_1',
        refundPolicy: 'Refunds up to 7 days before',
        transferAllowed: true,
        transferCutoff: null,
        resaleAllowed: false,
      },
      ticketTypes: [
        {
          id: 'ticket_1',
          eventId: 'evt_1',
          name: 'GA',
          kind: 'GA',
          currency: 'USD',
          priceCents: BigInt(5000),
          feeCents: BigInt(500),
          capacity: 100,
          perOrderLimit: null,
          salesStart: new Date('2025-09-01T00:00:00.000Z'),
          salesEnd: new Date('2025-10-31T23:59:59.000Z'),
          status: 'active',
          sortOrder: 0,
          deletedAt: null,
        },
      ],
      _count: {
        orders: 42,
        tickets: 80,
      },
    };

    prismaMock.event.findMany
      .mockResolvedValueOnce([mockEvent]) // hero
      .mockResolvedValueOnce([mockEvent]) // trending
      .mockResolvedValueOnce([]) // flash-sales
      .mockResolvedValueOnce([]); // seatmap showcase

    const response = await request(app.getHttpServer())
      .get('/homepage?city=Austin')
      .expect(200);

    expect(response.body.hero).not.toBeNull();
    expect(response.body.hero.featured).toHaveLength(1);
    const trending = response.body.sections.find(
      (section: any) => section.id === 'trending',
    );
    expect(trending).toBeDefined();
    expect(trending.items).toHaveLength(1);
  });
});
