import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { AdminFeeScheduleService } from '../services/fee-schedule.service';
import {
  FeeScheduleQueryDto,
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  CreateOrgFeeOverrideDto,
  UpdateOrgFeeOverrideDto,
} from '../dto/fee-schedule.dto';

@ApiTags('Admin - Fee Schedules')
@Controller('admin/fee-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminFeeScheduleController {
  constructor(private readonly feeScheduleService: AdminFeeScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'List all fee schedules' })
  @ApiResponse({
    status: 200,
    description: 'Fee schedules retrieved successfully',
  })
  async getFeeSchedules(@Query() query: FeeScheduleQueryDto) {
    const result = await this.feeScheduleService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get fee schedule statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats() {
    const stats = await this.feeScheduleService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fee schedule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Fee schedule retrieved successfully',
  })
  async getFeeSchedule(@Param('id') id: string) {
    const schedule = await this.feeScheduleService.findOne(id);
    return {
      success: true,
      data: schedule,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create fee schedule' })
  @ApiResponse({
    status: 201,
    description: 'Fee schedule created successfully',
  })
  async createFeeSchedule(@Body() dto: CreateFeeScheduleDto) {
    const schedule = await this.feeScheduleService.create(dto);
    return {
      success: true,
      data: schedule,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update fee schedule' })
  @ApiResponse({
    status: 200,
    description: 'Fee schedule updated successfully',
  })
  async updateFeeSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateFeeScheduleDto,
  ) {
    const schedule = await this.feeScheduleService.update(id, dto);
    return {
      success: true,
      data: schedule,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete fee schedule' })
  @ApiResponse({
    status: 200,
    description: 'Fee schedule deleted successfully',
  })
  @HttpCode(HttpStatus.OK)
  async deleteFeeSchedule(@Param('id') id: string) {
    const result = await this.feeScheduleService.remove(id);
    return {
      success: true,
      ...result,
    };
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate fee schedule' })
  @ApiResponse({
    status: 200,
    description: 'Fee schedule deactivated successfully',
  })
  @HttpCode(HttpStatus.OK)
  async deactivateFeeSchedule(@Param('id') id: string) {
    const schedule = await this.feeScheduleService.deactivate(id);
    return {
      success: true,
      data: schedule,
    };
  }

  @Post('overrides')
  @ApiOperation({ summary: 'Create organization fee override' })
  @ApiResponse({ status: 201, description: 'Override created successfully' })
  async createOverride(@Body() dto: CreateOrgFeeOverrideDto) {
    const override = await this.feeScheduleService.createOrgFeeOverride(dto);
    return {
      success: true,
      data: override,
    };
  }

  @Get('overrides/organization/:orgId')
  @ApiOperation({ summary: 'Get organization fee overrides' })
  @ApiResponse({ status: 200, description: 'Overrides retrieved successfully' })
  async getOrganizationOverrides(@Param('orgId') orgId: string) {
    const overrides = await this.feeScheduleService.getOrgFeeOverrides(orgId);
    return {
      success: true,
      data: overrides,
    };
  }

  @Patch('overrides/:id')
  @ApiOperation({ summary: 'Update fee override' })
  @ApiResponse({ status: 200, description: 'Override updated successfully' })
  async updateOverride(
    @Param('id') id: string,
    @Body() dto: UpdateOrgFeeOverrideDto,
  ) {
    const override = await this.feeScheduleService.updateOrgFeeOverride(
      id,
      dto,
    );
    return {
      success: true,
      data: override,
    };
  }

  @Delete('overrides/:id')
  @ApiOperation({ summary: 'Delete fee override' })
  @ApiResponse({ status: 200, description: 'Override deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteOverride(@Param('id') id: string) {
    const result = await this.feeScheduleService.deleteOrgFeeOverride(id);
    return {
      success: true,
      ...result,
    };
  }
}
