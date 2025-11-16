import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  createTestingModule,
  mockUser,
  mockOrganization,
  mockEvent,
} from '../test/setup';

describe('Events (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await createTestingModule();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/events (GET)', () => {
    it('should return public events', () => {
      // Mock the events lookup
      jest
        .spyOn(prismaService.event, 'findMany')
        .mockResolvedValue([mockEvent] as any);

      return request(app.getHttpServer())
        .get('/events')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0]).toHaveProperty('title', 'Test Event');
        });
    });

    it('should filter events by status', () => {
      // Mock the events lookup
      jest
        .spyOn(prismaService.event, 'findMany')
        .mockResolvedValue([mockEvent] as any);

      return request(app.getHttpServer())
        .get('/events?status=published')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
        });
    });
  });

  describe('/events/:id (GET)', () => {
    it('should return a specific event', () => {
      // Mock the event lookup
      jest
        .spyOn(prismaService.event, 'findUnique')
        .mockResolvedValue(mockEvent as any);

      return request(app.getHttpServer())
        .get('/events/event-1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', 'event-1');
          expect(res.body).toHaveProperty('title', 'Test Event');
        });
    });

    it('should return 404 for non-existent event', () => {
      // Mock the event lookup to return null
      jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/events/non-existent')
        .expect(404);
    });
  });

  describe('/orgs/:orgId/events (POST)', () => {
    it('should create a new event', () => {
      const createEventDto = {
        title: 'New Test Event',
        descriptionMd: 'This is a new test event',
        startAt: '2023-12-01T10:00:00Z',
        endAt: '2023-12-01T12:00:00Z',
      };

      // Mock JWT token verification
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ sub: 'user-1', email: 'test@example.com' });

      // Mock the organization membership lookup
      jest.spyOn(prismaService.orgMember, 'findUnique').mockResolvedValue({
        id: 'member-1',
        orgId: 'org-1',
        userId: 'user-1',
        role: 'owner',
      } as any);

      // Mock the event creation
      jest.spyOn(prismaService.event, 'create').mockResolvedValue({
        ...mockEvent,
        ...createEventDto,
        id: 'new-event-1',
      } as any);

      return request(app.getHttpServer())
        .post('/orgs/org-1/events')
        .set('Authorization', 'Bearer valid-token')
        .send(createEventDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', 'New Test Event');
        });
    });

    it('should return 401 for unauthenticated request', () => {
      const createEventDto = {
        title: 'New Test Event',
        descriptionMd: 'This is a new test event',
        startAt: '2023-12-01T10:00:00Z',
        endAt: '2023-12-01T12:00:00Z',
      };

      return request(app.getHttpServer())
        .post('/orgs/org-1/events')
        .send(createEventDto)
        .expect(401);
    });

    it('should return 403 for non-member', () => {
      const createEventDto = {
        title: 'New Test Event',
        descriptionMd: 'This is a new test event',
        startAt: '2023-12-01T10:00:00Z',
        endAt: '2023-12-01T12:00:00Z',
      };

      // Mock JWT token verification
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ sub: 'user-1', email: 'test@example.com' });

      // Mock the organization membership lookup to return null
      jest.spyOn(prismaService.orgMember, 'findUnique').mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/orgs/org-1/events')
        .set('Authorization', 'Bearer valid-token')
        .send(createEventDto)
        .expect(403);
    });
  });

  describe('/orgs/:orgId/events/:id (PATCH)', () => {
    it('should update an event', () => {
      const updateEventDto = {
        title: 'Updated Test Event',
      };

      // Mock JWT token verification
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ sub: 'user-1', email: 'test@example.com' });

      // Mock the organization membership lookup
      jest.spyOn(prismaService.orgMember, 'findUnique').mockResolvedValue({
        id: 'member-1',
        orgId: 'org-1',
        userId: 'user-1',
        role: 'owner',
      } as any);

      // Mock the event lookup
      jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue({
        ...mockEvent,
        orgId: 'org-1',
      } as any);

      // Mock the event update
      jest.spyOn(prismaService.event, 'update').mockResolvedValue({
        ...mockEvent,
        title: 'Updated Test Event',
      } as any);

      return request(app.getHttpServer())
        .patch('/orgs/org-1/events/event-1')
        .set('Authorization', 'Bearer valid-token')
        .send(updateEventDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Updated Test Event');
        });
    });

    it('should return 404 for non-existent event', () => {
      const updateEventDto = {
        title: 'Updated Test Event',
      };

      // Mock JWT token verification
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ sub: 'user-1', email: 'test@example.com' });

      // Mock the organization membership lookup
      jest.spyOn(prismaService.orgMember, 'findUnique').mockResolvedValue({
        id: 'member-1',
        orgId: 'org-1',
        userId: 'user-1',
        role: 'owner',
      } as any);

      // Mock the event lookup to return null
      jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue(null);

      return request(app.getHttpServer())
        .patch('/orgs/org-1/events/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send(updateEventDto)
        .expect(404);
    });
  });

  describe('/orgs/:orgId/events/:id (DELETE)', () => {
    it('should delete an event', () => {
      // Mock JWT token verification
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ sub: 'user-1', email: 'test@example.com' });

      // Mock the organization membership lookup
      jest.spyOn(prismaService.orgMember, 'findUnique').mockResolvedValue({
        id: 'member-1',
        orgId: 'org-1',
        userId: 'user-1',
        role: 'owner',
      } as any);

      // Mock the event lookup
      jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue({
        ...mockEvent,
        orgId: 'org-1',
      } as any);

      // Mock the ticket lookup to return no tickets
      jest.spyOn(prismaService.ticket, 'findMany').mockResolvedValue([]);

      // Mock the event deletion
      jest
        .spyOn(prismaService.event, 'delete')
        .mockResolvedValue(mockEvent as any);

      return request(app.getHttpServer())
        .delete('/orgs/org-1/events/event-1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty(
            'message',
            'Event deleted successfully',
          );
        });
    });

    it('should return 403 when trying to delete an event with tickets', () => {
      // Mock JWT token verification
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ sub: 'user-1', email: 'test@example.com' });

      // Mock the organization membership lookup
      jest.spyOn(prismaService.orgMember, 'findUnique').mockResolvedValue({
        id: 'member-1',
        orgId: 'org-1',
        userId: 'user-1',
        role: 'owner',
      } as any);

      // Mock the event lookup
      jest.spyOn(prismaService.event, 'findUnique').mockResolvedValue({
        ...mockEvent,
        orgId: 'org-1',
      } as any);

      // Mock the ticket lookup to return tickets
      jest
        .spyOn(prismaService.ticket, 'findMany')
        .mockResolvedValue([{} as any]);

      return request(app.getHttpServer())
        .delete('/orgs/org-1/events/event-1')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });
  });
});
