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
import type { AuthenticatedUser } from '../common/types/user.types';
import { TicketStatus } from '@prisma/client';
import { TicketsService } from './tickets.service';
import {
  CreateTransferDto,
  AcceptTransferDto,
  CreateCheckinDto,
  UpdateTicketStatusDto,
} from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface TicketFilters {
  eventId?: string;
  status?: TicketStatus;
  upcoming?: boolean;
}

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tickets for the current user' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  getUserTickets(
    @CurrentUser() user: AuthenticatedUser,
    @Query('eventId') eventId?: string,
    @Query('status') status?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    const filters: TicketFilters = {};
    if (eventId) filters.eventId = eventId;
    if (status) filters.status = status as TicketStatus;
    if (upcoming === 'true') filters.upcoming = true;

    return this.ticketsService.getUserTickets(user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ticketsService.getTicketById(id, user.id);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Initiate a ticket transfer' })
  @ApiResponse({ status: 201, description: 'Transfer initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ticket or recipient not found' })
  initiateTransfer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createTransferDto: CreateTransferDto,
  ) {
    return this.ticketsService.initiateTransfer(user.id, createTransferDto);
  }

  @Post('transfer/accept')
  @ApiOperation({ summary: 'Accept a ticket transfer' })
  @ApiResponse({ status: 200, description: 'Transfer accepted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  acceptTransfer(
    @CurrentUser() user: AuthenticatedUser,
    @Body() acceptTransferDto: AcceptTransferDto,
  ) {
    return this.ticketsService.acceptTransfer(user.id, acceptTransferDto);
  }

  @Delete('transfer/:transferId')
  @ApiOperation({ summary: 'Cancel a ticket transfer' })
  @ApiResponse({ status: 200, description: 'Transfer canceled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  cancelTransfer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('transferId') transferId: string,
  ) {
    return this.ticketsService.cancelTransfer(user.id, transferId);
  }

  @Get(':ticketId/transfers')
  @ApiOperation({ summary: 'Get all transfers for a ticket' })
  @ApiResponse({ status: 200, description: 'Transfers retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  getTransfersForTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Param('ticketId') ticketId: string,
  ) {
    return this.ticketsService.getTransfersForTicket(ticketId, user.id);
  }

  @Post('checkin')
  @ApiOperation({ summary: 'Check in a ticket' })
  @ApiResponse({ status: 201, description: 'Ticket checked in successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  checkInTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createCheckinDto: CreateCheckinDto,
  ) {
    return this.ticketsService.checkInTicket(createCheckinDto, user.id);
  }

  @Get('events/:eventId/checkins')
  @ApiOperation({ summary: 'Get all check-ins for an event' })
  @ApiResponse({ status: 200, description: 'Check-ins retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getCheckinsForEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ) {
    return this.ticketsService.getCheckinsForEvent(eventId, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  updateTicketStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateTicketStatusDto: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.updateTicketStatus(
      id,
      user.id,
      updateTicketStatusDto,
    );
  }

  @Post(':id/regenerate-qr')
  @ApiOperation({ summary: 'Regenerate QR code for a ticket' })
  @ApiResponse({ status: 200, description: 'QR code regenerated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  regenerateQRCode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ticketsService.regenerateQRCode(id, user.id);
  }

  @Get('events/:eventId/stats')
  @ApiOperation({ summary: 'Get ticket statistics for an event' })
  @ApiResponse({
    status: 200,
    description: 'Ticket statistics retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getTicketStats(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ) {
    return this.ticketsService.getTicketStats(eventId, user.id);
  }
}
