import {
  Body,
  Controller,
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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PlatformRole } from '@prisma/client';
import { AdminModerationService } from '../services/moderation.service';
import {
  FlagQueryDto,
  ResolveFlagDto,
  ModerationActionQueryDto,
} from '../dto/moderation.dto';

@ApiTags('Admin - Moderation & Flags')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminModerationController {
  constructor(private readonly moderationService: AdminModerationService) {}

  @Get('flags')
  @ApiOperation({ summary: 'Get all flags with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Flags retrieved successfully' })
  async getFlags(@Query() query: FlagQueryDto) {
    const result = await this.moderationService.getFlags(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('flags/stats')
  @ApiOperation({ summary: 'Get moderation statistics' })
  @ApiResponse({
    status: 200,
    description: 'Moderation stats retrieved successfully',
  })
  async getModerationStats() {
    const stats = await this.moderationService.getModerationStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('flags/:id')
  @ApiOperation({ summary: 'Get flag details' })
  @ApiResponse({ status: 200, description: 'Flag retrieved successfully' })
  async getFlag(@Param('id') id: string) {
    const flag = await this.moderationService.getFlag(id);
    return {
      success: true,
      data: flag,
    };
  }

  @Post('flags/:id/resolve')
  @ApiOperation({ summary: 'Resolve flag' })
  @ApiResponse({ status: 200, description: 'Flag resolved successfully' })
  @HttpCode(HttpStatus.OK)
  async resolveFlag(
    @Param('id') id: string,
    @Body() dto: ResolveFlagDto,
    @CurrentUser() user: { id?: string },
  ) {
    const result = await this.moderationService.resolveFlag(
      id,
      dto,
      user?.id || '',
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('moderation/actions')
  @ApiOperation({ summary: 'Get moderation actions' })
  @ApiResponse({
    status: 200,
    description: 'Moderation actions retrieved successfully',
  })
  async getModerationActions(@Query() query: ModerationActionQueryDto) {
    const result = await this.moderationService.getModerationActions(query);
    return {
      success: true,
      data: result,
    };
  }
}
