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
import { AdminRefundService } from '../services/refund.service';
import {
  RefundQueryDto,
  CreateRefundDto,
  UpdateRefundStatusDto,
  ApproveRefundDto,
  RejectRefundDto,
  ProcessRefundDto,
} from '../dto/refund.dto';

@ApiTags('Admin - Refunds')
@Controller('admin/refunds')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminRefundController {
  constructor(private readonly refundService: AdminRefundService) {}

  @Get()
  @ApiOperation({ summary: 'List all refunds with pagination' })
  @ApiResponse({ status: 200, description: 'Refunds retrieved successfully' })
  async getRefunds(@Query() query: RefundQueryDto) {
    const result = await this.refundService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get refund by ID' })
  @ApiResponse({ status: 200, description: 'Refund retrieved successfully' })
  async getRefund(@Param('id') id: string) {
    const refund = await this.refundService.findOne(id);
    return {
      success: true,
      data: refund,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create refund manually' })
  @ApiResponse({ status: 201, description: 'Refund created successfully' })
  async createRefund(@Body() dto: CreateRefundDto) {
    const refund = await this.refundService.create(dto);
    return {
      success: true,
      data: refund,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update refund status' })
  @ApiResponse({ status: 200, description: 'Refund status updated successfully' })
  async updateRefundStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRefundStatusDto,
  ) {
    const refund = await this.refundService.updateStatus(id, dto);
    return {
      success: true,
      data: refund,
    };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve refund request' })
  @ApiResponse({ status: 200, description: 'Refund approved successfully' })
  @HttpCode(HttpStatus.OK)
  async approveRefund(@Param('id') id: string, @Body() dto: ApproveRefundDto) {
    const refund = await this.refundService.approve(id, dto);
    return {
      success: true,
      data: refund,
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject refund request' })
  @ApiResponse({ status: 200, description: 'Refund rejected successfully' })
  @HttpCode(HttpStatus.OK)
  async rejectRefund(@Param('id') id: string, @Body() dto: RejectRefundDto) {
    const refund = await this.refundService.reject(id, dto);
    return {
      success: true,
      data: refund,
    };
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process approved refund' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @HttpCode(HttpStatus.OK)
  async processRefund(@Param('id') id: string, @Body() dto: ProcessRefundDto) {
    const refund = await this.refundService.process(id, dto);
    return {
      success: true,
      data: refund,
    };
  }
}
