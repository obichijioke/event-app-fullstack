import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrganizerDashboardService } from './organizer-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Organizer Dashboard')
@Controller('organizer/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerDashboardController {
  constructor(private readonly dashboardService: OrganizerDashboardService) {}

  @Get()
  @ApiQuery({ name: 'orgId', required: true })
  getOverview(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    return this.dashboardService.getOverview(orgId, user.id);
  }
}
