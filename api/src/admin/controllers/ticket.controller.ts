import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PlatformRole } from '@prisma/client';
import { AdminTicketService } from '../services/ticket.service';
import {
  TicketAdminQueryDto,
  TransferQueryDto,
  CheckinQueryDto,
} from '../dto/ticket.dto';

@ApiTags('Admin - Tickets')
@Controller('admin/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminTicketController {
  constructor(private readonly ticketService: AdminTicketService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tickets with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  async getTickets(@Query() query: TicketAdminQueryDto) {
    const result = await this.ticketService.getTickets(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket statistics' })
  @ApiResponse({
    status: 200,
    description: 'Ticket stats retrieved successfully',
  })
  async getTicketStats() {
    const stats = await this.ticketService.getTicketStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Get ticket transfers' })
  @ApiResponse({ status: 200, description: 'Transfers retrieved successfully' })
  async getTransfers(@Query() query: TransferQueryDto) {
    const result = await this.ticketService.getTransfers(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('checkins')
  @ApiOperation({ summary: 'Get ticket check-ins' })
  @ApiResponse({ status: 200, description: 'Check-ins retrieved successfully' })
  async getCheckins(@Query() query: CheckinQueryDto) {
    const result = await this.ticketService.getCheckins(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  async getTicket(@Param('id') id: string) {
    const ticket = await this.ticketService.getTicket(id);
    return {
      success: true,
      data: ticket,
    };
  }

  @Post(':id/void')
  @ApiOperation({ summary: 'Void ticket' })
  @ApiResponse({ status: 200, description: 'Ticket voided successfully' })
  @HttpCode(HttpStatus.OK)
  async voidTicket(@Param('id') id: string) {
    const result = await this.ticketService.voidTicket(id);
    return {
      success: true,
      ...result,
    };
  }
}
