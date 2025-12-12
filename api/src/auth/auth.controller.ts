import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  Get,
  HttpStatus,
  HttpCode,
  Patch,
  Delete,
  Param,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SessionCleanupService } from './session-cleanup.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UserFollowsService } from '../organizations/user-follows.service';
import { extractRefreshTokenFromRequest } from './utils/refresh-token-extractor';
import { RequestEmailVerificationDto } from './dto/request-email-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TwoFaCodeDto, RequestTwoFaCodeDto } from './dto/twofa.dto';
import { PlatformRole } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userFollowsService: UserFollowsService,
    private sessionCleanupService: SessionCleanupService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Request() req, @Response() res) {
    const userAgent = req.headers['user-agent'];
    const ipAddr = req.ip || req.connection.remoteAddress;

    const result = await this.authService.login(loginDto, userAgent, ipAddr);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set access token in HTTP-only cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes (same as JWT expiry)
    });

    // Return access token and user info (for backward compatibility)
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@CurrentUser() _user: any, @Request() req, @Response() res) {
    const refreshToken =
      extractRefreshTokenFromRequest(req) ?? req.body?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const result = await this.authService.refreshTokens(refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddr: req.ip || req.connection?.remoteAddress,
    });

    // Set new refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set new access token in HTTP-only cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Return new access token (for backward compatibility)
    res.json({
      accessToken: result.accessToken,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@CurrentUser() user: any, @Response() res) {
    if (user.sessionId) {
      await this.authService.logout(user.sessionId);
    }

    // Clear both access and refresh token cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logout successful' });
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({
    status: 200,
    description: 'Logout from all devices successful',
  })
  async logoutAll(@CurrentUser() user: any, @Response() res) {
    await this.authService.logoutAll(user.id);

    // Clear both access and refresh token cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logout from all devices successful' });
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active and historical sessions for the user' })
  async listSessions(@CurrentUser() user: any) {
    return this.authService.listSessions(user.id, user.sessionId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(user.id, sessionId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('password/forgot')
  @ApiOperation({ summary: 'Request password reset link' })
  async requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(body);
  }

  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('email/verify/request')
  @ApiOperation({ summary: 'Request email verification token' })
  async requestEmailVerification(@Body() body: RequestEmailVerificationDto) {
    return this.authService.requestEmailVerification(body);
  }

  @Post('email/verify')
  @ApiOperation({ summary: 'Verify email using token' })
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body);
  }

  @Post('2fa/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a 2FA code (enable/disable)' })
  async requestTwoFactor(
    @CurrentUser() user: any,
    @Body() body: RequestTwoFaCodeDto,
  ) {
    return this.authService.requestTwoFactorCode(
      user.id,
      body.purpose || 'enable',
    );
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  async enableTwoFactor(@CurrentUser() user: any, @Body() body: TwoFaCodeDto) {
    return this.authService.enableTwoFactor(user.id, body.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  async disableTwoFactor(@CurrentUser() user: any, @Body() body: TwoFaCodeDto) {
    return this.authService.disableTwoFactor(user.id, body.code);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  @ApiResponse({ status: 409, description: 'Email already taken' })
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({
    status: 201,
    description:
      'API key created successfully. Save the secret - it will not be shown again!',
  })
  createApiKey(
    @CurrentUser() user: any,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.authService.createApiKey(user.id, createApiKeyDto);
  }

  @Get('api-keys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all API keys for the current user' })
  @ApiResponse({
    status: 200,
    description: 'API keys retrieved successfully',
  })
  listApiKeys(@CurrentUser() user: any) {
    return this.authService.listApiKeys(user.id);
  }

  @Delete('api-keys/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({
    status: 200,
    description: 'API key revoked successfully',
  })
  @ApiResponse({ status: 404, description: 'API key not found' })
  revokeApiKey(@CurrentUser() user: any, @Param('id') id: string) {
    return this.authService.revokeApiKey(user.id, id);
  }

  @Get('me/following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organizations the current user is following' })
  @ApiResponse({
    status: 200,
    description: 'Following list retrieved successfully',
  })
  getFollowing(@CurrentUser() user: any) {
    return this.userFollowsService.getFollowing(user.id);
  }

  // Admin Session Management Endpoints

  @Post('admin/sessions/cleanup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger session cleanup (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Session cleanup completed successfully',
  })
  async adminCleanupSessions(
    @CurrentUser() user: any,
    @Query('olderThanDays') olderThanDays?: string,
    @Query('includeActive') includeActive?: string,
  ) {
    // Check if user is admin
    if (user.role !== PlatformRole.admin) {
      throw new UnauthorizedException('Admin access required');
    }

    return this.sessionCleanupService.manualCleanup({
      olderThanDays: olderThanDays ? parseInt(olderThanDays, 10) : 30,
      includeActive: includeActive === 'true',
    });
  }

  @Get('admin/sessions/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get session statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Session statistics retrieved successfully',
  })
  async getSessionStats(@CurrentUser() user: any) {
    // Check if user is admin
    if (user.role !== PlatformRole.admin) {
      throw new UnauthorizedException('Admin access required');
    }

    await this.sessionCleanupService.logSessionStats();
    return { message: 'Session stats logged - check server logs' };
  }
}
