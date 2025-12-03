import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Event Announcements')
@Controller('events/:eventId/announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create announcement for event (organizer only)' })
  create(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(eventId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all announcements for an event (public)' })
  findAll(
    @Param('eventId') eventId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.announcementsService.findByEvent(
      eventId,
      includeInactive === 'true',
    );
  }

  @Patch(':announcementId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update announcement (organizer only)' })
  update(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Param('announcementId') announcementId: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(
      eventId,
      announcementId,
      user.id,
      dto,
    );
  }

  @Delete(':announcementId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete announcement (organizer only)' })
  remove(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Param('announcementId') announcementId: string,
  ) {
    return this.announcementsService.remove(eventId, announcementId, user.id);
  }

  // Analytics & tracking
  @Post(':announcementId/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track announcement view' })
  trackView(
    @CurrentUser() user: any,
    @Param('announcementId') announcementId: string,
  ) {
    return this.announcementsService.trackView(announcementId, user.id);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get announcement analytics (organizer only)' })
  getAnalytics(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.announcementsService.getAnalytics(eventId, user.id);
  }

  // Dismissal management
  @Post(':announcementId/dismiss')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dismiss announcement' })
  dismiss(
    @CurrentUser() user: any,
    @Param('announcementId') announcementId: string,
  ) {
    return this.announcementsService.dismissAnnouncement(
      announcementId,
      user.id,
    );
  }

  @Delete(':announcementId/dismiss')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Undismiss announcement' })
  undismiss(
    @CurrentUser() user: any,
    @Param('announcementId') announcementId: string,
  ) {
    return this.announcementsService.undismissAnnouncement(
      announcementId,
      user.id,
    );
  }

  @Get('dismissed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dismissed announcement IDs' })
  getDismissed(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.announcementsService.getDismissed(eventId, user.id);
  }

  // Organizer: Send notification
  @Post(':announcementId/notify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send notification for announcement (organizer only)',
  })
  async sendNotification(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Param('announcementId') announcementId: string,
  ) {
    const announcement = await this.announcementsService.update(
      eventId,
      announcementId,
      user.id,
      {},
    );
    await this.announcementsService.sendAnnouncementNotification(announcement);
    return { success: true, message: 'Notifications queued' };
  }
}
