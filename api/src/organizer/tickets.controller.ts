import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TicketingService } from '../ticketing/ticketing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTicketTypeDto } from '../ticketing/dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from '../ticketing/dto/update-ticket-type.dto';
import {
  CreateTicketPriceTierDto,
  CreateHoldDto,
} from '../ticketing/dto/create-ticket-type.dto';
import { UpdateTicketPriceTierDto } from '../ticketing/dto/update-ticket-type.dto';
import { BulkSeatAssignmentDto } from './dto/bulk-seat-assignment.dto';

@ApiTags('Organizer Tickets')
@Controller('organizer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerTicketsController {
  constructor(private readonly ticketingService: TicketingService) {}

  @Get('events/:eventId/tickets')
  @ApiOperation({ summary: 'List ticket types for an event' })
  listTicketTypes(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.ticketingService.findAllTicketTypesForEvent(eventId, user.id);
  }

  @Post('events/:eventId/tickets')
  @ApiOperation({ summary: 'Create a ticket type' })
  createTicketType(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: CreateTicketTypeDto,
  ) {
    return this.ticketingService.createTicketTypeForEvent(
      eventId,
      user.id,
      dto,
    );
  }

  @Get('tickets/:ticketTypeId')
  @ApiOperation({ summary: 'Get ticket type details' })
  getTicketType(
    @CurrentUser() user: any,
    @Param('ticketTypeId') ticketTypeId: string,
  ) {
    return this.ticketingService.findOneTicketType(ticketTypeId, user.id);
  }

  @Patch('tickets/:ticketTypeId')
  @ApiOperation({ summary: 'Update a ticket type' })
  updateTicketType(
    @CurrentUser() user: any,
    @Param('ticketTypeId') ticketTypeId: string,
    @Body() dto: UpdateTicketTypeDto,
  ) {
    return this.ticketingService.updateTicketType(ticketTypeId, user.id, dto);
  }

  @Delete('tickets/:ticketTypeId')
  @ApiOperation({ summary: 'Archive a ticket type' })
  removeTicketType(
    @CurrentUser() user: any,
    @Param('ticketTypeId') ticketTypeId: string,
  ) {
    return this.ticketingService.removeTicketType(ticketTypeId, user.id);
  }

  @Post('tickets/:ticketTypeId/tiers')
  @ApiOperation({ summary: 'Create a price tier for a ticket type' })
  createPriceTier(
    @CurrentUser() user: any,
    @Param('ticketTypeId') ticketTypeId: string,
    @Body() dto: CreateTicketPriceTierDto,
  ) {
    return this.ticketingService.createPriceTier(ticketTypeId, user.id, dto);
  }

  @Patch('tiers/:tierId')
  @ApiOperation({ summary: 'Update a price tier' })
  updatePriceTier(
    @CurrentUser() user: any,
    @Param('tierId') tierId: string,
    @Body() dto: UpdateTicketPriceTierDto,
  ) {
    return this.ticketingService.updatePriceTier(tierId, user.id, dto);
  }

  @Delete('tiers/:tierId')
  @ApiOperation({ summary: 'Delete a price tier' })
  deletePriceTier(@CurrentUser() user: any, @Param('tierId') tierId: string) {
    return this.ticketingService.removePriceTier(tierId, user.id);
  }

  @Post('tickets/:ticketTypeId/seats/bulk')
  @ApiOperation({ summary: 'Assign seats to a seated ticket type' })
  bulkAssignSeats(
    @CurrentUser() user: any,
    @Param('ticketTypeId') ticketTypeId: string,
    @Body() dto: BulkSeatAssignmentDto,
  ) {
    return this.ticketingService.bulkAssignSeats(
      ticketTypeId,
      user.id,
      dto.seatIds,
    );
  }

  @Get('events/:eventId/inventory')
  @ApiOperation({ summary: 'Get inventory summary for an event' })
  getInventory(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.ticketingService.getInventorySummary(eventId, user.id);
  }

  @Post('events/:eventId/holds')
  @ApiOperation({ summary: 'Create a hold on tickets or seats' })
  createHold(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: CreateHoldDto,
  ) {
    return this.ticketingService.createHold(eventId, user.id, dto);
  }

  @Get('events/:eventId/holds')
  @ApiOperation({ summary: 'View active holds for an event' })
  getHolds(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.ticketingService.getHoldsForEvent(eventId, user.id);
  }

  @Delete('holds/:holdId')
  @ApiOperation({ summary: 'Release a hold' })
  releaseHold(@CurrentUser() user: any, @Param('holdId') holdId: string) {
    return this.ticketingService.releaseHold(holdId, user.id);
  }
}
