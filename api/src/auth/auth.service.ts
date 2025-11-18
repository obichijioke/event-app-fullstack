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
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailerService } from '../common/mailer/mailer.service';
import { RequestTwoFaCodeDto } from './dto/twofa.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailer: MailerService,
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
    } catch {
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

  async listSessions(userId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddr: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, revokedAt: true },
    });

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.revokedAt) {
      return { message: 'Session already revoked' };
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Session revoked successfully' };
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

  async requestEmailVerification(dto: RequestEmailVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If an account exists, a verification email has been sent' };
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email already verified' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    this.mailer.sendMail({
      to: user.email,
      subject: 'Verify your email',
      text: `Use this token to verify your email: ${token}`,
    });

    return {
      message: 'Verification email sent',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenRecord = await this.prisma.emailVerificationToken.findUnique({
      where: { token: dto.token },
    });

    if (
      !tokenRecord ||
      tokenRecord.usedAt ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If an account exists, a reset link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    this.mailer.sendMail({
      to: user.email,
      subject: 'Reset your password',
      text: `Use this token to reset your password: ${token}`,
    });

    return {
      message: 'Password reset link sent',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (
      !tokenRecord ||
      tokenRecord.usedAt ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: tokenRecord.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await this.logoutAll(user.id);

    return { message: 'Password reset successfully' };
  }

  async requestTwoFactorCode(userId: string, purpose: 'enable' | 'disable') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (purpose === 'enable' && user.twofaEnabled) {
      return { message: '2FA already enabled' };
    }
    if (purpose === 'disable' && !user.twofaEnabled) {
      return { message: '2FA already disabled' };
    }

    const code = (crypto.randomInt(0, 999999)).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);

    await this.prisma.twoFactorCode.create({
      data: {
        userId,
        purpose,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send via email for now
    this.mailer.sendMail({
      to: user.email,
      subject: 'Your 2FA code',
      text: `Code: ${code}`,
    });

    return { message: '2FA code sent' };
  }

  async enableTwoFactor(userId: string, code: string) {
    return this.verifyTwoFactorCode(userId, code, 'enable', true);
  }

  async disableTwoFactor(userId: string, code: string) {
    return this.verifyTwoFactorCode(userId, code, 'disable', false);
  }

  private async verifyTwoFactorCode(
    userId: string,
    code: string,
    purpose: 'enable' | 'disable',
    enable: boolean,
  ) {
    const latest = await this.prisma.twoFactorCode.findFirst({
      where: {
        userId,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      throw new UnauthorizedException('Code not found or expired');
    }

    const matches = await bcrypt.compare(code, latest.codeHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid code');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { twofaEnabled: enable },
      }),
      this.prisma.twoFactorCode.update({
        where: { id: latest.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: `Two-factor authentication ${enable ? 'enabled' : 'disabled'}` };
  }
}
