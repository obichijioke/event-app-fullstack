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
import { AdminTaxRateService } from '../services/tax-rate.service';
import {
  TaxRateQueryDto,
  CreateTaxRateDto,
  UpdateTaxRateDto,
} from '../dto/tax-rate.dto';

@ApiTags('Admin - Tax Rates')
@Controller('admin/tax-rates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminTaxRateController {
  constructor(private readonly taxRateService: AdminTaxRateService) {}

  @Get()
  @ApiOperation({ summary: 'List all tax rates' })
  @ApiResponse({ status: 200, description: 'Tax rates retrieved successfully' })
  async getTaxRates(@Query() query: TaxRateQueryDto) {
    const result = await this.taxRateService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get tax rate statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats() {
    const stats = await this.taxRateService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('country/:country')
  @ApiOperation({ summary: 'Get tax rates by country' })
  @ApiResponse({ status: 200, description: 'Tax rates retrieved successfully' })
  async getTaxRatesByCountry(@Param('country') country: string) {
    const rates = await this.taxRateService.findByCountry(country);
    return {
      success: true,
      data: rates,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax rate by ID' })
  @ApiResponse({ status: 200, description: 'Tax rate retrieved successfully' })
  async getTaxRate(@Param('id') id: string) {
    const rate = await this.taxRateService.findOne(id);
    return {
      success: true,
      data: rate,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create tax rate' })
  @ApiResponse({ status: 201, description: 'Tax rate created successfully' })
  async createTaxRate(@Body() dto: CreateTaxRateDto) {
    const rate = await this.taxRateService.create(dto);
    return {
      success: true,
      data: rate,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tax rate' })
  @ApiResponse({ status: 200, description: 'Tax rate updated successfully' })
  async updateTaxRate(@Param('id') id: string, @Body() dto: UpdateTaxRateDto) {
    const rate = await this.taxRateService.update(id, dto);
    return {
      success: true,
      data: rate,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tax rate' })
  @ApiResponse({ status: 200, description: 'Tax rate deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteTaxRate(@Param('id') id: string) {
    const result = await this.taxRateService.remove(id);
    return {
      success: true,
      ...result,
    };
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate tax rate' })
  @ApiResponse({
    status: 200,
    description: 'Tax rate deactivated successfully',
  })
  @HttpCode(HttpStatus.OK)
  async deactivateTaxRate(@Param('id') id: string) {
    const rate = await this.taxRateService.deactivate(id);
    return {
      success: true,
      data: rate,
    };
  }
}
