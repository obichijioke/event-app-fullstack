import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../common/types/user.types';
import { TicketingService } from './ticketing.service';
import {
  CreateTicketTypeDto,
  CreateTicketPriceTierDto,
  CreateHoldDto,
} from './dto/create-ticket-type.dto';
import {
  UpdateTicketTypeDto,
  UpdateTicketPriceTierDto,
} from './dto/update-ticket-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Ticketing')
@Controller('ticketing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketingController {
  constructor(private readonly ticketingService: TicketingService) {}

  // Ticket Types
  @Post('events/:eventId/ticket-types')
  @ApiOperation({ summary: 'Create a new ticket type for an event' })
  @ApiResponse({ status: 201, description: 'Ticket type created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  createTicketType(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Body() createTicketTypeDto: CreateTicketTypeDto,
  ) {
    return this.ticketingService.createTicketTypeForEvent(
      eventId,
      user.id,
      createTicketTypeDto,
    );
  }

  @Get('events/:eventId/ticket-types')
  @ApiOperation({ summary: 'Get all ticket types for an event' })
  @ApiResponse({
    status: 200,
    description: 'Ticket types retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getTicketTypesForEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ) {
    return this.ticketingService.findAllTicketTypesForEvent(eventId, user.id);
  }

  @Get('ticket-types/:id')
  @ApiOperation({ summary: 'Get a ticket type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket type retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ticket type not found' })
  getTicketType(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ticketingService.findOneTicketType(id, user.id);
  }

  @Patch('ticket-types/:id')
  @ApiOperation({ summary: 'Update a ticket type' })
  @ApiResponse({ status: 200, description: 'Ticket type updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ticket type not found' })
  updateTicketType(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateTicketTypeDto: UpdateTicketTypeDto,
  ) {
    return this.ticketingService.updateTicketType(
      id,
      user.id,
      updateTicketTypeDto,
    );
  }

  @Delete('ticket-types/:id')
  @ApiOperation({ summary: 'Delete a ticket type' })
  @ApiResponse({ status: 200, description: 'Ticket type deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ticket type not found' })
  removeTicketType(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ticketingService.removeTicketType(id, user.id);
  }

  // Price Tiers
  @Post('ticket-types/:ticketTypeId/price-tiers')
  @ApiOperation({ summary: 'Create a new price tier for a ticket type' })
  @ApiResponse({ status: 201, description: 'Price tier created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Ticket type not found' })
  createPriceTier(
    @CurrentUser() user: AuthenticatedUser,
    @Param('ticketTypeId') ticketTypeId: string,
    @Body() createPriceTierDto: CreateTicketPriceTierDto,
  ) {
    return this.ticketingService.createPriceTier(
      ticketTypeId,
      user.id,
      createPriceTierDto,
    );
  }

  @Patch('price-tiers/:id')
  @ApiOperation({ summary: 'Update a price tier' })
  @ApiResponse({ status: 200, description: 'Price tier updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Price tier not found' })
  updatePriceTier(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updatePriceTierDto: UpdateTicketPriceTierDto,
  ) {
    return this.ticketingService.updatePriceTier(
      id,
      user.id,
      updatePriceTierDto,
    );
  }

  @Delete('price-tiers/:id')
  @ApiOperation({ summary: 'Delete a price tier' })
  @ApiResponse({ status: 200, description: 'Price tier deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Price tier not found' })
  removePriceTier(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ticketingService.removePriceTier(id, user.id);
  }

  // Holds
  @Post('events/:eventId/holds')
  @ApiOperation({ summary: 'Create a new hold for an event' })
  @ApiResponse({ status: 201, description: 'Hold created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  createHold(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Body() createHoldDto: CreateHoldDto,
  ) {
    return this.ticketingService.createHold(eventId, user.id, createHoldDto);
  }

  @Get('events/:eventId/holds')
  @ApiOperation({ summary: 'Get all holds for an event' })
  @ApiResponse({ status: 200, description: 'Holds retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getHoldsForEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ) {
    return this.ticketingService.getHoldsForEvent(eventId, user.id);
  }

  @Delete('holds/:holdId')
  @ApiOperation({ summary: 'Release a hold' })
  @ApiResponse({ status: 200, description: 'Hold released successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Hold not found' })
  releaseHold(
    @CurrentUser() user: AuthenticatedUser,
    @Param('holdId') holdId: string,
  ) {
    return this.ticketingService.releaseHold(holdId, user.id);
  }
}
