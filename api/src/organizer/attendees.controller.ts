import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrganizerAttendeesService } from './organizer-attendees.service';
import { OrganizerAttendeeQueryDto } from './dto/organizer-attendee-query.dto';
import { OrganizerTransferTicketDto } from './dto/organizer-transfer.dto';
import { CreateCheckinDto } from '../tickets/dto/create-ticket.dto';
import { OrganizerRecentCheckinsQueryDto } from './dto/organizer-checkin-query.dto';

@ApiTags('Organizer Attendees')
@Controller('organizer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerAttendeesController {
  constructor(private readonly attendeesService: OrganizerAttendeesService) {}

  @Get('events/:eventId/attendees')
  @ApiOperation({ summary: 'List attendees for an event' })
  @ApiQuery({ name: 'orgId', required: true })
  getAttendees(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('eventId') eventId: string,
    @Query() query: OrganizerAttendeeQueryDto,
  ) {
    return this.attendeesService.listAttendees(orgId, eventId, user.id, query);
  }

  @Post('tickets/:ticketId/transfer')
  @ApiOperation({ summary: 'Transfer a ticket to another attendee' })
  @ApiQuery({ name: 'orgId', required: true })
  transferTicket(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: OrganizerTransferTicketDto,
  ) {
    return this.attendeesService.transferTicket(orgId, ticketId, user.id, dto);
  }

  @Post('tickets/:ticketId/resend')
  @ApiOperation({ summary: 'Resend ticket confirmation to attendee' })
  @ApiQuery({ name: 'orgId', required: true })
  resendTicket(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('ticketId') ticketId: string,
  ) {
    return this.attendeesService.resendTicket(orgId, ticketId, user.id);
  }

  @Post('checkins')
  @ApiOperation({ summary: 'Record a manual check-in' })
  @ApiQuery({ name: 'orgId', required: true })
  recordCheckin(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Body() dto: CreateCheckinDto,
  ) {
    return this.attendeesService.recordCheckin(orgId, user.id, dto);
  }

  @Get('events/:eventId/checkin-stats')
  @ApiOperation({ summary: 'Get check-in statistics for an event' })
  @ApiQuery({ name: 'orgId', required: true })
  getCheckinStats(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.attendeesService.getCheckinStats(orgId, eventId, user.id);
  }

  @Get('events/:eventId/recent-checkins')
  @ApiOperation({ summary: 'Get recent check-ins for an event' })
  @ApiQuery({ name: 'orgId', required: true })
  getRecentCheckins(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('eventId') eventId: string,
    @Query() query: OrganizerRecentCheckinsQueryDto,
  ) {
    return this.attendeesService.getRecentCheckins(
      orgId,
      eventId,
      user.id,
      query.limit,
    );
  }
}
