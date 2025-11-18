import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PlatformRole } from '@prisma/client';
import { AdminSessionService } from '../services/session.service';
import { SessionQueryDto } from '../dto/session.dto';

@ApiTags('Admin - Sessions')
@Controller('admin/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminSessionController {
  constructor(private readonly sessionService: AdminSessionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sessions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getSessions(@Query() query: SessionQueryDto) {
    const result = await this.sessionService.getSessions(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get session statistics' })
  @ApiResponse({
    status: 200,
    description: 'Session stats retrieved successfully',
  })
  async getSessionStats() {
    const stats = await this.sessionService.getSessionStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Param('id') id: string) {
    const result = await this.sessionService.revokeSession(id);
    return {
      success: true,
      ...result,
    };
  }

  @Post('users/:userId/revoke-all')
  @ApiOperation({ summary: 'Revoke all user sessions' })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked successfully',
  })
  @HttpCode(HttpStatus.OK)
  async revokeAllUserSessions(@Param('userId') userId: string) {
    const result = await this.sessionService.revokeAllUserSessions(userId);
    return {
      success: true,
      ...result,
    };
  }
}
