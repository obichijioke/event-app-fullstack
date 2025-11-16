import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { createTestingModule, mockUser } from '../test/setup';

describe('Authentication (e2e)', () => {
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

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // Mock the user creation
      jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(mockUser as any);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user).toHaveProperty('email', 'test@example.com');
        });
    });

    it('should return 400 for invalid email', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should return 400 for short password', () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login a user with valid credentials', () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock the user lookup and password validation
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        password: '$2b$10$hashedpassword', // Mock hashed password
      } as any);

      // Mock JWT token generation
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user).toHaveProperty('email', 'test@example.com');
        });
    });

    it('should return 401 for invalid credentials', () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Mock the user lookup
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 400 for missing email', () => {
      const loginDto = {
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens with valid refresh token', () => {
      const refreshDto = {
        refreshToken: 'valid-refresh-token',
      };

      // Mock the session lookup
      jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        refreshToken: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      } as any);

      // Mock the user lookup
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser as any);

      // Mock JWT token generation
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-mock-jwt-token');

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should return 401 for invalid refresh token', () => {
      const refreshDto = {
        refreshToken: 'invalid-refresh-token',
      };

      // Mock the session lookup to return null
      jest.spyOn(prismaService.session, 'findUnique').mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshDto)
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should return user profile with valid token', () => {
      // Mock JWT token verification
      jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ sub: 'user-1', email: 'test@example.com' });

      // Mock the user lookup
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser as any);

      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('name', 'Test User');
        });
    });

    it('should return 401 for missing token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 401 for invalid token', () => {
      // Mock JWT token verification to throw an error
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
