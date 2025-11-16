import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { AppModule } from '../app.module';

export async function createTestingModule(): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({
      // Mock PrismaService
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      organization: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      event: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      ticket: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    } as any)
    .overrideProvider(RedisService)
    .useValue({
      // Mock RedisService
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      getClient: jest.fn(),
    } as any)
    .compile();

  return moduleRef;
}

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'attendee',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockOrganization = {
  id: 'org-1',
  name: 'Test Organization',
  legalName: 'Test Organization LLC',
  website: 'https://example.com',
  country: 'US',
  supportEmail: 'support@example.com',
  taxId: '123456789',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockEvent = {
  id: 'event-1',
  title: 'Test Event',
  descriptionMd: 'This is a test event',
  status: 'published',
  visibility: 'public',
  startAt: new Date(),
  endAt: new Date(),
  doorTime: new Date(),
  publishAt: new Date(),
  ageRestriction: '18+',
  coverImageUrl: 'https://example.com/image.jpg',
  language: 'en',
  orgId: 'org-1',
  venueId: 'venue-1',
  seatmapId: 'seatmap-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockVenue = {
  id: 'venue-1',
  name: 'Test Venue',
  address: {
    line1: '123 Main St',
    line2: 'Suite 100',
    city: 'Test City',
    region: 'CA',
    postal: '12345',
    country: 'US',
  },
  timezone: 'America/Los_Angeles',
  capacity: 1000,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockTicketType = {
  id: 'ticket-type-1',
  name: 'General Admission',
  kind: 'general',
  currency: 'USD',
  priceCents: 5000,
  feeCents: 500,
  capacity: 1000,
  perOrderLimit: 10,
  salesStart: new Date(),
  salesEnd: new Date(),
  status: 'active',
  sortOrder: 1,
  eventId: 'event-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockOrder = {
  id: 'order-1',
  eventId: 'event-1',
  occurrenceId: 'occurrence-1',
  userId: 'user-1',
  status: 'pending',
  subtotalCents: 5000,
  feesCents: 500,
  taxCents: 450,
  totalCents: 5950,
  currency: 'USD',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockTicket = {
  id: 'ticket-1',
  orderId: 'order-1',
  eventId: 'event-1',
  ticketTypeId: 'ticket-type-1',
  seatId: 'seat-1',
  status: 'valid',
  issuedAt: new Date(),
  ownerId: 'user-1',
  qrCode: 'qr-code-1',
  barcode: 'barcode-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};
