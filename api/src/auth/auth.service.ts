import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { PlatformRole } from '@prisma/client';
import type { SignOptions } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        role: PlatformRole.attendee,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(loginDto: LoginDto, userAgent?: string, ipAddr?: string) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // Create session + generate tokens
    const session = await this.createSession(user.id, userAgent, ipAddr);
    const { accessToken, refreshToken } = this.generateTokens(user, session.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshTokens(
    refreshToken: string,
    metadata?: { userAgent?: string; ipAddr?: string },
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    let payload: { sub: string; email: string; sessionId: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.prisma.userSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const newSession = await this.createSession(
      user.id,
      metadata?.userAgent ?? session.userAgent ?? undefined,
      metadata?.ipAddr ?? session.ipAddr ?? undefined,
    );

    return this.generateTokens(user, newSession.id);
  }

  async logout(sessionId: string) {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string) {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all sessions
    await this.logoutAll(userId);

    return { message: 'Password changed successfully' };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { email, name, phone } = updateProfileDto;

    // If email is being changed, check if it's already taken
    if (email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email is already taken');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email,
        name,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async createApiKey(userId: string, createApiKeyDto: CreateApiKeyDto) {
    const { name, scopes = [] } = createApiKeyDto;

    // Generate a random secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Create a prefix for quick lookup (first 8 chars of secret)
    const prefix = secret.substring(0, 8);

    // Hash the secret for storage
    const hashedSecret = await bcrypt.hash(secret, 10);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        prefix,
        hashedSecret,
        scopes,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    // Return the plain secret only once (user must save it)
    return {
      ...apiKey,
      secret: `${prefix}.${secret}`, // Format: prefix.secret
    };
  }

  async listApiKeys(userId: string) {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return apiKeys;
  }

  async revokeApiKey(userId: string, apiKeyId: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new UnauthorizedException('You do not own this API key');
    }

    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'API key revoked successfully' };
  }

  private getRefreshSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    return secret;
  }

  private getRefreshExpiresIn(): SignOptions['expiresIn'] {
    return (
      this.configService.get<SignOptions['expiresIn']>(
        'JWT_REFRESH_EXPIRES_IN',
      ) ?? '7d'
    );
  }

  private buildSessionExpiryDate(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  private async createSession(
    userId: string,
    userAgent?: string,
    ipAddr?: string,
  ) {
    return this.prisma.userSession.create({
      data: {
        userId,
        userAgent,
        ipAddr,
        expiresAt: this.buildSessionExpiryDate(),
      },
    });
  }

  private generateTokens(
    user: { id: string; email: string },
    sessionId: string,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: this.getRefreshExpiresIn(),
    });

    return { accessToken, refreshToken };
  }
}
