import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { EventStatus, PlatformRole } from '@prisma/client';

describe('Admin Events (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let testEventId: string;
  let testOrgId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();

    // Create test admin user and get token
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        name: 'Test Admin',
        role: PlatformRole.admin,
        passwordHash: 'hashed_password',
      },
    });

    // Create test organization
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        ownerId: adminUser.id,
      },
    });
    testOrgId = testOrg.id;

    // Create test event
    const testEvent = await prisma.event.create({
      data: {
        title: 'Test Event',
        descriptionMd: 'Test event description',
        status: EventStatus.pending,
        orgId: testOrgId,
        startAt: new Date('2025-12-01T10:00:00Z'),
        endAt: new Date('2025-12-01T12:00:00Z'),
      },
    });
    testEventId = testEvent.id;

    // Mock JWT token for admin (simplified for e2e test)
    adminToken = 'mock_admin_jwt_token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.event.deleteMany({ where: { orgId: testOrgId } });
    await prisma.organization.deleteMany({ where: { id: testOrgId } });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'admin-' } },
    });
    await prisma.user.deleteMany({ where: { email: 'user@test.com' } });
    await app.close();
  });

  describe('GET /admin/events', () => {
    it('should return paginated events list', () => {
      return request(app.getHttpServer())
        .get('/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data.data)).toBe(true);
        });
    });

    it('should filter events by status', () => {
      return request(app.getHttpServer())
        .get('/admin/events?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(
            res.body.data.data.every(
              (event: any) => event.status === 'pending',
            ),
          ).toBe(true);
        });
    });

    it('should sort events by valid field', () => {
      return request(app.getHttpServer())
        .get('/admin/events?sortBy=title&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should reject invalid sort field', () => {
      return request(app.getHttpServer())
        .get('/admin/events?sortBy=invalidField')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /admin/events/:id', () => {
    it('should return event details', () => {
      return request(app.getHttpServer())
        .get(`/admin/events/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(testEventId);
          expect(res.body.data).toHaveProperty('title');
          expect(res.body.data).toHaveProperty('status');
          expect(res.body.data).toHaveProperty('organizerName');
        });
    });

    it('should return 404 for non-existent event', () => {
      return request(app.getHttpServer())
        .get('/admin/events/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /admin/events/:id/status', () => {
    it('should update event status successfully', () => {
      return request(app.getHttpServer())
        .patch(`/admin/events/${testEventId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: EventStatus.approved })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.message).toContain(
            'Event status updated successfully',
          );
        });
    });

    it('should reject invalid status transition', () => {
      return request(app.getHttpServer())
        .patch(`/admin/events/${testEventId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: EventStatus.live }) // Invalid transition from approved
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid status transition');
        });
    });

    it('should reject status update for suspended organization', async () => {
      // Suspend the organization
      await prisma.organization.update({
        where: { id: testOrgId },
        data: { status: 'suspended' },
      });

      return request(app.getHttpServer())
        .patch(`/admin/events/${testEventId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: EventStatus.live })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('organization is suspended');
        });
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject requests without authentication', () => {
      return request(app.getHttpServer()).get('/admin/events').expect(401);
    });

    it('should reject requests from non-admin users', async () => {
      // Create non-admin user
      const regularUser = await prisma.user.create({
        data: {
          email: `user-${Date.now()}@test.com`,
          name: 'Regular User',
          role: PlatformRole.attendee,
          passwordHash: 'hashed_password',
        },
      });

      const regularToken = 'mock_regular_jwt_token';

      return request(app.getHttpServer())
        .get('/admin/events')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403)
        .then(async () => {
          // Clean up
          await prisma.user.delete({ where: { id: regularUser.id } });
        });
    });
  });
});
