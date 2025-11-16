import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrganizerNotificationsService } from './organizer-notifications.service';

@ApiTags('Organizer Notifications')
@Controller('organizer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerNotificationsController {
  constructor(
    private readonly notificationsService: OrganizerNotificationsService,
  ) {}

  @Get('notifications')
  @ApiOperation({
    summary: 'List actionable notifications for an organization',
  })
  @ApiQuery({ name: 'orgId', required: true })
  listNotifications(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    return this.notificationsService.list(orgId, user.id);
  }

  @Post('flags/:flagId/resolve')
  @ApiOperation({ summary: 'Resolve a moderation flag' })
  @ApiQuery({ name: 'orgId', required: true })
  resolveFlag(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('flagId') flagId: string,
  ) {
    return this.notificationsService.resolveFlag(orgId, user.id, flagId);
  }
}
