import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { AdminDisputeService } from '../services/dispute.service';
import {
  DisputeQueryDto,
  UpdateDisputeStatusDto,
  RespondToDisputeDto,
  CloseDisputeDto,
} from '../dto/dispute.dto';

@ApiTags('Admin - Disputes')
@Controller('admin/disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminDisputeController {
  constructor(private readonly disputeService: AdminDisputeService) {}

  @Get()
  @ApiOperation({ summary: 'List all disputes with pagination' })
  @ApiResponse({ status: 200, description: 'Disputes retrieved successfully' })
  async getDisputes(@Query() query: DisputeQueryDto) {
    const result = await this.disputeService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dispute statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    const stats = await this.disputeService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute by ID' })
  @ApiResponse({ status: 200, description: 'Dispute retrieved successfully' })
  async getDispute(@Param('id') id: string) {
    const dispute = await this.disputeService.findOne(id);
    return {
      success: true,
      data: dispute,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update dispute status' })
  @ApiResponse({ status: 200, description: 'Dispute status updated successfully' })
  async updateDisputeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    const dispute = await this.disputeService.updateStatus(id, dto);
    return {
      success: true,
      data: dispute,
    };
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Respond to dispute' })
  @ApiResponse({ status: 200, description: 'Response submitted successfully' })
  @HttpCode(HttpStatus.OK)
  async respondToDispute(@Param('id') id: string, @Body() dto: RespondToDisputeDto) {
    const dispute = await this.disputeService.respond(id, dto);
    return {
      success: true,
      data: dispute,
    };
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close dispute' })
  @ApiResponse({ status: 200, description: 'Dispute closed successfully' })
  @HttpCode(HttpStatus.OK)
  async closeDispute(@Param('id') id: string, @Body() dto: CloseDisputeDto) {
    const dispute = await this.disputeService.close(id, dto);
    return {
      success: true,
      data: dispute,
    };
  }
}
