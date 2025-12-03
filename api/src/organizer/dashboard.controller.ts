import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get organizer dashboard overview' })
  getOverview(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    return this.dashboardService.getOverview(orgId, user.id);
  }

  @Get('creator-drafts')
  @ApiQuery({ name: 'orgId', required: true })
  @ApiOperation({
    summary: 'Get all creator v2 in-progress drafts for an organization',
  })
  getCreatorDrafts(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    return this.dashboardService.getCreatorDrafts(orgId, user.id);
  }

  @Delete('creator-drafts/:draftId')
  @ApiQuery({ name: 'orgId', required: true })
  @ApiOperation({ summary: 'Delete a creator v2 draft' })
  deleteCreatorDraft(
    @CurrentUser() user: any,
    @Param('draftId') draftId: string,
    @Query('orgId') orgId: string,
  ) {
    return this.dashboardService.deleteCreatorDraft(draftId, orgId, user.id);
  }
}
