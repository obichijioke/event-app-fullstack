import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrganizerAnalyticsService } from './organizer-analytics.service';

@ApiTags('Organizer Analytics')
@Controller('organizer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerAnalyticsController {
  constructor(private readonly analyticsService: OrganizerAnalyticsService) {}

  @Get('events/:eventId/analytics')
  @ApiOperation({ summary: 'Get analytics for a specific event' })
  @ApiQuery({ name: 'orgId', required: true })
  getEventAnalytics(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.analyticsService.getEventAnalytics(orgId, eventId, user.id);
  }

  @Get('organization/insights')
  @ApiOperation({ summary: 'Get organization-level insights and reviews' })
  @ApiQuery({ name: 'orgId', required: true })
  getOrgInsights(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    return this.analyticsService.getOrganizationInsights(orgId, user.id);
  }
}
