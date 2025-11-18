import {
  Controller,
  Get,
  Patch,
  Post,
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
import { AdminService } from './admin.service';
import {
  AdminEventService,
  AdminPaymentService,
  AdminPayoutService,
  AdminCategoryService,
  AdminAuditService,
  AdminSettingsService,
} from './services';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRole } from '@prisma/client';
import {
  EventQueryDto,
  PaymentQueryDto,
  PayoutQueryDto,
  AuditLogQueryDto,
} from './dto/query-params.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { UpdateSiteSettingsDto } from './dto/site-settings.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from './dto/category.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly eventService: AdminEventService,
    private readonly paymentService: AdminPaymentService,
    private readonly payoutService: AdminPayoutService,
    private readonly categoryService: AdminCategoryService,
    private readonly auditService: AdminAuditService,
    private readonly settingsService: AdminSettingsService,
  ) {}

  // ========================================
  // Dashboard Metrics
  // ========================================

  @Get('metrics')
  @ApiOperation({ summary: 'Get platform-wide metrics and statistics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getMetrics() {
    const metrics = await this.adminService.getMetrics();
    return {
      success: true,
      data: metrics,
    };
  }

  // ========================================
  // Events Management
  // ========================================

  @Get('events')
  @ApiOperation({ summary: 'List all events with admin filters' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async getEvents(@Query() query: EventQueryDto) {
    const result = await this.eventService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get event details by ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  async getEvent(@Param('id') id: string) {
    const event = await this.eventService.findOne(id);
    return {
      success: true,
      data: event,
    };
  }

  @Patch('events/:id/status')
  @ApiOperation({ summary: 'Update event status (approve/reject/suspend)' })
  @ApiResponse({
    status: 200,
    description: 'Event status updated successfully',
  })
  async updateEventStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventStatusDto,
  ) {
    const event = await this.eventService.updateStatus(id, dto);
    return {
      success: true,
      data: event,
    };
  }

  // ========================================
  // Payments
  // ========================================

  @Get('payments')
  @ApiOperation({ summary: 'List all payments with filtering' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPayments(@Query() query: PaymentQueryDto) {
    const result = await this.paymentService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  // ========================================
  // Payouts
  // ========================================

  @Get('payouts')
  @ApiOperation({ summary: 'List all payouts' })
  @ApiResponse({ status: 200, description: 'Payouts retrieved successfully' })
  async getPayouts(@Query() query: PayoutQueryDto) {
    const result = await this.payoutService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('payouts/:id/approve')
  @ApiOperation({ summary: 'Approve payout request' })
  @ApiResponse({ status: 200, description: 'Payout approved successfully' })
  @HttpCode(HttpStatus.OK)
  async approvePayout(@Param('id') id: string) {
    const payout = await this.payoutService.approve(id);
    return {
      success: true,
      data: payout,
    };
  }

  // ========================================
  // Categories
  // ========================================

  @Get('categories')
  @ApiOperation({ summary: 'List all event categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getCategories(@Query() query: CategoryQueryDto) {
    const result = await this.categoryService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  async getCategory(@Param('id') id: string) {
    const category = await this.categoryService.findOne(id);
    return {
      success: true,
      data: category,
    };
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new event category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.categoryService.create(dto);
    return {
      success: true,
      data: category,
    };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoryService.update(id, dto);
    return {
      success: true,
      data: category,
    };
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteCategory(@Param('id') id: string) {
    const result = await this.categoryService.remove(id);
    return result;
  }

  // ========================================
  // Audit Logs
  // ========================================

  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit logs with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    const result = await this.auditService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  // ========================================
  // Site Settings
  // ========================================

  @Get('settings')
  @ApiOperation({ summary: 'Get site-wide settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings() {
    const settings = await this.settingsService.get();
    return {
      success: true,
      data: settings,
    };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update site-wide settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@Body() dto: UpdateSiteSettingsDto) {
    const settings = await this.settingsService.update(dto);
    return {
      success: true,
      data: settings,
    };
  }
}
