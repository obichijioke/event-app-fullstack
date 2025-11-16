import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import {
  CreateFlagDto,
  CreateModerationActionDto,
  UpdateFlagDto,
  GetFlagsDto,
  GetModerationStatsDto,
} from './dto/create-moderation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // Flag endpoints
  @Post('flags')
  @ApiOperation({ summary: 'Create a new flag' })
  @ApiResponse({ status: 201, description: 'Flag created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createFlag(@CurrentUser() user: any, @Body() createFlagDto: CreateFlagDto) {
    return this.moderationService.createFlag(createFlagDto, user.id);
  }

  @Get('flags')
  @ApiOperation({ summary: 'Get all flags' })
  @ApiResponse({ status: 200, description: 'Flags retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAllFlags(@CurrentUser() user: any, @Query() getFlagsDto: GetFlagsDto) {
    return this.moderationService.findAllFlags(getFlagsDto, user.id);
  }

  @Get('flags/:id')
  @ApiOperation({ summary: 'Get a flag by ID' })
  @ApiResponse({ status: 200, description: 'Flag retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  findOneFlag(@CurrentUser() user: any, @Param('id') id: string) {
    return this.moderationService.findOneFlag(id, user.id);
  }

  @Patch('flags/:id')
  @ApiOperation({ summary: 'Update a flag' })
  @ApiResponse({ status: 200, description: 'Flag updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Flag not found' })
  updateFlag(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateFlagDto: UpdateFlagDto,
  ) {
    return this.moderationService.updateFlag(id, user.id, updateFlagDto);
  }

  // Moderation action endpoints
  @Post('actions')
  @ApiOperation({ summary: 'Create a moderation action' })
  @ApiResponse({
    status: 201,
    description: 'Moderation action created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createModerationAction(
    @CurrentUser() user: any,
    @Body() createModerationActionDto: CreateModerationActionDto,
  ) {
    return this.moderationService.createModerationAction(
      createModerationActionDto,
      user.id,
    );
  }

  // Stats endpoints
  @Get('stats')
  @ApiOperation({ summary: 'Get moderation statistics' })
  @ApiResponse({
    status: 200,
    description: 'Moderation statistics retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getModerationStats(
    @CurrentUser() user: any,
    @Query() getModerationStatsDto: GetModerationStatsDto,
  ) {
    return this.moderationService.getModerationStats(
      getModerationStatsDto,
      user.id,
    );
  }

  // Flagged content endpoint
  @Get('flagged-content')
  @ApiOperation({ summary: 'Get all flagged content' })
  @ApiResponse({
    status: 200,
    description: 'Flagged content retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getFlaggedContent(@CurrentUser() user: any) {
    return this.moderationService.getFlaggedContent(user.id);
  }
}
