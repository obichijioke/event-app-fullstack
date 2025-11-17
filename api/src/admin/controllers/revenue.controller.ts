import {
  Controller,
  Get,
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
import { AdminRevenueService } from '../services/revenue.service';
import { RevenueQueryDto } from '../dto/revenue.dto';

@ApiTags('Admin - Revenue Analytics')
@Controller('admin/revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminRevenueController {
  constructor(private readonly revenueService: AdminRevenueService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get revenue overview' })
  @ApiResponse({ status: 200, description: 'Revenue overview retrieved successfully' })
  async getRevenueOverview(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueOverview(query);
    return {
      success: true,
      data,
    };
  }

  @Get('by-period')
  @ApiOperation({ summary: 'Get revenue by time period' })
  @ApiResponse({ status: 200, description: 'Revenue by period retrieved successfully' })
  async getRevenueByPeriod(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueByPeriod(query);
    return {
      success: true,
      data,
    };
  }

  @Get('by-organization')
  @ApiOperation({ summary: 'Get revenue by organization' })
  @ApiResponse({ status: 200, description: 'Revenue by organization retrieved successfully' })
  async getRevenueByOrganization(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueByOrganization(query);
    return {
      success: true,
      data,
    };
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get revenue by event category' })
  @ApiResponse({ status: 200, description: 'Revenue by category retrieved successfully' })
  async getRevenueByCategory(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueByCategory(query);
    return {
      success: true,
      data,
    };
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get revenue trends' })
  @ApiResponse({ status: 200, description: 'Revenue trends retrieved successfully' })
  async getRevenueTrends(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueTrends(query);
    return {
      success: true,
      data,
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get consolidated revenue metrics' })
  @ApiResponse({ status: 200, description: 'Revenue metrics retrieved successfully' })
  async getRevenueMetrics(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueMetrics(query);
    return {
      success: true,
      data,
    };
  }
}
