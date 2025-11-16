import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
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
import { AdminService } from './admin.service';
import {
  AdminAuditService,
  AdminCategoryService,
  AdminEventService,
  AdminOrganizationService,
  AdminPaymentService,
  AdminPayoutService,
  AdminRefundService,
  AdminSettingsService,
  AdminUserService,
  AdminVenueCatalogService,
  AdminVenuesService,
} from './services';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRole } from '@prisma/client';
import {
  UserQueryDto,
  OrganizationQueryDto,
  EventQueryDto,
  PaymentQueryDto,
  PayoutQueryDto,
  AuditLogQueryDto,
} from './dto/query-params.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { UpdateSiteSettingsDto } from './dto/site-settings.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from './dto/category.dto';
import {
  RefundQueryDto,
  CreateRefundDto,
  UpdateRefundStatusDto,
  ApproveRefundDto,
  RejectRefundDto,
  ProcessRefundDto,
} from './dto/refund.dto';
import { GrantRoleDto, RevokeRoleDto } from './dto/roles.dto';
import {
  OrganizationVerificationQueryDto,
  SubmitForVerificationDto,
  UploadDocumentDto,
  ReviewDocumentDto,
  ApproveOrganizationDto,
  RejectOrganizationDto,
  SuspendOrganizationDto,
  AppealReviewDto,
} from './dto/verification.dto';
import {
  CreateVenueCatalogDto,
  UpdateVenueCatalogDto,
  VenueCatalogImportOptionsDto,
  VenueCatalogQueryDto,
} from './dto/venue-catalog.dto';
import { AdminVenueQueryDto } from './dto/venue-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly organizationService: AdminOrganizationService,
    private readonly userService: AdminUserService,
    private readonly eventService: AdminEventService,
    private readonly paymentService: AdminPaymentService,
    private readonly payoutService: AdminPayoutService,
    private readonly refundService: AdminRefundService,
    private readonly categoryService: AdminCategoryService,
    private readonly auditService: AdminAuditService,
    private readonly settingsService: AdminSettingsService,
    private readonly venueCatalogService: AdminVenueCatalogService,
    private readonly venuesAdminService: AdminVenuesService,
  ) {}

  // Dashboard Metrics
  @Get('metrics')
  @ApiOperation({ summary: 'Get platform metrics for admin dashboard' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getMetrics() {
    const startTime = Date.now();
    try {
      const data = await this.adminService.getMetrics();
      const duration = Date.now() - startTime;
      this.logger.log(`Admin metrics retrieved in ${duration}ms`);
      return {
        success: true,
        data,
        _meta: { duration },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to retrieve admin metrics: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  // User Management
  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(@Query() query: UserQueryDto) {
    const result = await this.userService.getUsers(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    const data = await this.userService.getUser(id);
    return {
      success: true,
      data,
    };
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    const user = await this.userService.updateUser(id, data);
    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    };
  }

  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend user' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async suspendUser(@Param('id') id: string) {
    const result = await this.userService.suspendUser(id);
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Post('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activateUser(@Param('id') id: string) {
    const result = await this.userService.activateUser(id);
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    const result = await this.userService.deleteUser(id);
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Post('users/:id/grant-role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Grant platform role to a user' })
  @ApiResponse({ status: 200, description: 'Role granted successfully' })
  async grantUserRole(
    @CurrentUser() actor: { id?: string },
    @Param('id') id: string,
    @Body() dto: GrantRoleDto,
  ) {
    const actorId = actor?.id;
    const result = await this.userService.grantPlatformRole(
      id,
      dto.role,
      actorId,
    );
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Post('users/:id/revoke-role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke platform role from a user' })
  @ApiResponse({ status: 200, description: 'Role revoked successfully' })
  async revokeUserRole(
    @CurrentUser() actor: { id?: string },
    @Param('id') id: string,
    @Body() dto: RevokeRoleDto,
  ) {
    const actorId = actor?.id;
    const fallback = dto?.fallback;
    const result = await this.userService.revokePlatformRole(
      id,
      actorId,
      fallback,
    );
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  // Organization Management
  @Get('organizations')
  @ApiOperation({
    summary: 'Get all organizations with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Organizations retrieved successfully',
  })
  async getOrganizations(@Query() query: OrganizationQueryDto) {
    const result = await this.organizationService.getOrganizations(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('organizations/:id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({
    status: 200,
    description: 'Organization retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganization(@Param('id') id: string) {
    const data = await this.organizationService.getOrganization(id);
    return {
      success: true,
      data,
    };
  }

  @Patch('organizations/:id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async updateOrganization(
    @Param('id') id: string,
    @Body() data: UpdateOrganizationDto,
  ) {
    const organization = await this.organizationService.updateOrganization(
      id,
      data,
    );
    return {
      success: true,
      data: organization,
      message: 'Organization updated successfully',
    };
  }

  // Event Management
  @Get('events')
  @ApiOperation({ summary: 'Get all events with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  async getEvents(@Query() query: EventQueryDto) {
    const startTime = Date.now();
    try {
      const result = await this.eventService.getEvents(query);
      const duration = Date.now() - startTime;
      this.logger.log(
        `Admin events list retrieved in ${duration}ms (page: ${query.page || 1}, limit: ${query.limit || 10})`,
      );
      return {
        success: true,
        data: result,
        _meta: { duration },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve admin events: ${errorMessage}`);
      throw error;
    }
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEvent(@Param('id') id: string) {
    const startTime = Date.now();
    try {
      const data = await this.eventService.getEvent(id);
      const duration = Date.now() - startTime;
      this.logger.log(`Admin event ${id} retrieved in ${duration}ms`);
      return {
        success: true,
        data,
        _meta: { duration },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to retrieve admin event ${id}: ${errorMessage}`,
      );
      throw error;
    }
  }

  @Patch('events/:id/status')
  @ApiOperation({ summary: 'Update event status' })
  @ApiResponse({
    status: 200,
    description: 'Event status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEventStatus(
    @Param('id') id: string,
    @Body() data: UpdateEventStatusDto,
  ) {
    const startTime = Date.now();
    try {
      const result = await this.eventService.updateEventStatus(id, data);
      const duration = Date.now() - startTime;
      this.logger.log(
        `Admin event ${id} status updated to ${data.status} in ${duration}ms`,
      );
      return {
        success: true,
        data: null,
        ...result,
        _meta: { duration },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to update admin event ${id} status to ${data.status}: ${errorMessage}`,
      );
      throw error;
    }
  }

  // Payment Management
  @Get('payments')
  @ApiOperation({ summary: 'Get all payments with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getPayments(@Query() query: PaymentQueryDto) {
    const result = await this.paymentService.getPayments(query);
    return {
      success: true,
      data: result,
    };
  }

  // Payout Management
  @Get('payouts')
  @ApiOperation({ summary: 'Get all payouts with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Payouts retrieved successfully' })
  async getPayouts(@Query() query: PayoutQueryDto) {
    const result = await this.payoutService.getPayouts(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('payouts/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve payout' })
  @ApiResponse({ status: 200, description: 'Payout approved successfully' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  async approvePayout(@Param('id') id: string) {
    const result = await this.payoutService.approvePayout(id);
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  // Audit Logs
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    const result = await this.auditService.getAuditLogs(query);
    return {
      success: true,
      data: result,
    };
  }

  // Site Settings
  @Get('settings')
  @ApiOperation({ summary: 'Get site settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSiteSettings() {
    const data = await this.settingsService.getSiteSettings();
    return {
      success: true,
      data,
    };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update site settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSiteSettings(@Body() settings: UpdateSiteSettingsDto) {
    const data = await this.settingsService.updateSiteSettings(settings);
    return {
      success: true,
      data,
      message: 'Settings updated successfully',
    };
  }

  // Category Management
  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getCategories(@Query() query: CategoryQueryDto) {
    const data = await this.categoryService.getCategories(query);
    return {
      success: true,
      data,
    };
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  async getCategoryById(@Param('id') id: string) {
    const data = await this.categoryService.getCategoryById(id);
    return {
      success: true,
      data,
    };
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const data = await this.categoryService.createCategory(dto);
    return {
      success: true,
      data,
      message: 'Category created successfully',
    };
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categoryService.updateCategory(id, dto);
    return {
      success: true,
      data,
      message: 'Category updated successfully',
    };
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  async deleteCategory(@Param('id') id: string) {
    const data = await this.categoryService.deleteCategory(id);
    return {
      success: true,
      data,
      message: 'Category deleted successfully',
    };
  }

  // Venue Catalog Management
  @Get('venues/catalog')
  @ApiOperation({ summary: 'List venue catalog entries' })
  @ApiResponse({ status: 200, description: 'Catalog entries retrieved' })
  async listVenueCatalog(@Query() query: VenueCatalogQueryDto) {
    const result = await this.venueCatalogService.list(query);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('venues/catalog/:id')
  @ApiOperation({ summary: 'Get a venue catalog entry' })
  @ApiResponse({ status: 200, description: 'Catalog entry retrieved' })
  async getVenueCatalog(@Param('id') id: string) {
    const data = await this.venueCatalogService.findOne(id);
    return {
      success: true,
      data,
    };
  }

  @Post('venues/catalog')
  @ApiOperation({ summary: 'Create a venue catalog entry' })
  @ApiResponse({ status: 201, description: 'Catalog entry created' })
  async createVenueCatalog(@Body() dto: CreateVenueCatalogDto) {
    const data = await this.venueCatalogService.create(dto);
    return {
      success: true,
      data,
      message: 'Catalog entry created successfully',
    };
  }

  @Patch('venues/catalog/:id')
  @ApiOperation({ summary: 'Update a venue catalog entry' })
  @ApiResponse({ status: 200, description: 'Catalog entry updated' })
  async updateVenueCatalog(
    @Param('id') id: string,
    @Body() dto: UpdateVenueCatalogDto,
  ) {
    const data = await this.venueCatalogService.update(id, dto);
    return {
      success: true,
      data,
      message: 'Catalog entry updated successfully',
    };
  }

  @Delete('venues/catalog/:id')
  @ApiOperation({ summary: 'Delete (soft) a venue catalog entry' })
  @ApiResponse({ status: 200, description: 'Catalog entry deleted' })
  async deleteVenueCatalog(@Param('id') id: string) {
    const data = await this.venueCatalogService.delete(id);
    return {
      success: true,
      data,
      message: 'Catalog entry deleted successfully',
    };
  }

  @Post('venues/catalog/import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  @ApiOperation({ summary: 'Import venue catalog entries from JSON file' })
  @ApiResponse({
    status: 200,
    description: 'Catalog entries processed successfully',
  })
  async importVenueCatalog(
    @UploadedFile() file: multer.Multer.File,
    @Query() options: VenueCatalogImportOptionsDto,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Upload a JSON file under the "file" field',
      );
    }
    const data = await this.venueCatalogService.importFromFile(
      file.buffer,
      options,
    );
    return {
      success: true,
      data,
      message: 'Catalog import processed',
    };
  }

  // Venue Management
  @Get('venues')
  @ApiOperation({ summary: 'List all venues' })
  @ApiResponse({ status: 200, description: 'Venues retrieved successfully' })
  async listVenues(@Query() query: AdminVenueQueryDto) {
    const result = await this.venuesAdminService.list(query);
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('venues/:id')
  @ApiOperation({ summary: 'Get venue details' })
  @ApiResponse({ status: 200, description: 'Venue retrieved successfully' })
  async getVenue(@Param('id') id: string) {
    const data = await this.venuesAdminService.findOne(id);
    return {
      success: true,
      data,
    };
  }

  @Delete('venues/:id')
  @ApiOperation({ summary: 'Archive a venue' })
  @ApiResponse({ status: 200, description: 'Venue archived successfully' })
  async archiveVenue(@Param('id') id: string) {
    const data = await this.venuesAdminService.archive(id);
    return {
      success: true,
      data,
    };
  }

  @Post('venues/:id/restore')
  @ApiOperation({ summary: 'Restore an archived venue' })
  @ApiResponse({ status: 200, description: 'Venue restored successfully' })
  async restoreVenue(@Param('id') id: string) {
    const data = await this.venuesAdminService.restore(id);
    return {
      success: true,
      data,
    };
  }

  // Refund Management
  @Get('refunds')
  @ApiOperation({ summary: 'Get all refunds with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Refunds retrieved successfully' })
  async getRefunds(@Query() query: RefundQueryDto) {
    const result = await this.refundService.getRefunds(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('refunds/:id')
  @ApiOperation({ summary: 'Get refund by ID' })
  @ApiResponse({ status: 200, description: 'Refund retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  async getRefund(@Param('id') id: string) {
    const data = await this.refundService.getRefund(id);
    return {
      success: true,
      data,
    };
  }

  @Post('refunds')
  @ApiOperation({ summary: 'Create a refund' })
  @ApiResponse({ status: 201, description: 'Refund created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund request' })
  async createRefund(@Body() dto: CreateRefundDto) {
    const data = await this.refundService.createRefund(dto);
    return {
      success: true,
      data,
      message: 'Refund created successfully',
    };
  }

  @Patch('refunds/:id/status')
  @ApiOperation({ summary: 'Update refund status' })
  @ApiResponse({
    status: 200,
    description: 'Refund status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  async updateRefundStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRefundStatusDto,
  ) {
    const data = await this.refundService.updateRefundStatus(id, dto);
    return {
      success: true,
      data,
      message: 'Refund status updated successfully',
    };
  }

  @Post('refunds/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve refund' })
  @ApiResponse({ status: 200, description: 'Refund approved successfully' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  async approveRefund(@Param('id') id: string, @Body() dto: ApproveRefundDto) {
    const result = await this.refundService.approveRefund(id, dto);
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Post('refunds/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject refund' })
  @ApiResponse({ status: 200, description: 'Refund rejected successfully' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  async rejectRefund(@Param('id') id: string, @Body() dto: RejectRefundDto) {
    const result = await this.refundService.rejectRefund(id, dto);
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Post('refunds/:id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process refund with payment provider' })
  @ApiResponse({
    status: 200,
    description: 'Refund processed successfully',
  })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  @ApiResponse({ status: 400, description: 'Refund cannot be processed' })
  async processRefund(@Param('id') id: string, @Body() dto: ProcessRefundDto) {
    const result = await this.refundService.processRefund(id, dto);
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  // Organization Verification Management
  @Get('organizations/verification')
  @ApiOperation({
    summary: 'Get organizations for verification review',
  })
  @ApiResponse({
    status: 200,
    description: 'Organizations retrieved successfully',
  })
  async getOrganizationsForVerification(
    @Query() query: OrganizationVerificationQueryDto,
  ) {
    const result =
      await this.organizationService.getOrganizationsForVerification(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('organizations/:id/verification')
  @ApiOperation({ summary: 'Get organization verification details' })
  @ApiResponse({
    status: 200,
    description: 'Organization verification details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrganizationForVerification(@Param('id') id: string) {
    const data =
      await this.organizationService.getOrganizationForVerification(id);
    return {
      success: true,
      data,
    };
  }

  @Post('organizations/:id/verification/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit organization for verification' })
  @ApiResponse({
    status: 200,
    description: 'Organization submitted for verification successfully',
  })
  async submitOrganizationForVerification(
    @Param('id') id: string,
    @Body() dto: SubmitForVerificationDto,
    @CurrentUser() user: { id?: string },
  ) {
    const result =
      await this.organizationService.submitOrganizationForVerification(
        id,
        dto,
        user?.id || '',
      );
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Post('organizations/:id/verification/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload verification document' })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
  })
  async uploadVerificationDocument(
    @Param('id') id: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: multer.Multer.File,
    @CurrentUser() user: { id?: string },
  ) {
    const result = await this.organizationService.uploadVerificationDocument(
      id,
      dto,
      file,
      user?.id || '',
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('organizations/verification/documents/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review verification document' })
  @ApiResponse({
    status: 200,
    description: 'Document reviewed successfully',
  })
  async reviewVerificationDocument(
    @Param('id') id: string,
    @Body() dto: ReviewDocumentDto,
    @CurrentUser() user: { id?: string },
  ) {
    const result = await this.organizationService.reviewVerificationDocument(
      id,
      dto,
      user?.id || '',
    );
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Post('organizations/:id/verification/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve organization verification' })
  @ApiResponse({
    status: 200,
    description: 'Organization approved successfully',
  })
  async approveOrganization(
    @Param('id') id: string,
    @Body() dto: ApproveOrganizationDto,
    @CurrentUser() user: { id?: string },
  ) {
    const result = await this.organizationService.approveOrganization(
      id,
      dto,
      user?.id || '',
    );
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Post('organizations/:id/verification/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject organization verification' })
  @ApiResponse({
    status: 200,
    description: 'Organization rejected',
  })
  async rejectOrganization(
    @Param('id') id: string,
    @Body() dto: RejectOrganizationDto,
    @CurrentUser() user: { id?: string },
  ) {
    const result = await this.organizationService.rejectOrganization(
      id,
      dto,
      user?.id || '',
    );
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Post('organizations/:id/verification/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend organization' })
  @ApiResponse({
    status: 200,
    description: 'Organization suspended',
  })
  async suspendOrganization(
    @Param('id') id: string,
    @Body() dto: SuspendOrganizationDto,
    @CurrentUser() user: { id?: string },
  ) {
    const result = await this.organizationService.suspendOrganization(
      id,
      dto,
      user?.id || '',
    );
    return {
      success: true,
      data: null,
      ...result,
    };
  }

  @Post('organizations/verification/appeals/:id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review organization appeal' })
  @ApiResponse({
    status: 200,
    description: 'Appeal reviewed successfully',
  })
  async reviewOrganizationAppeal(
    @Param('id') id: string,
    @Body() dto: AppealReviewDto,
    @CurrentUser() user: { id?: string },
  ) {
    const result = await this.organizationService.reviewOrganizationAppeal(
      id,
      dto,
      user?.id || '',
    );
    return {
      success: true,
      data: null,
      ...result,
    };
  }
}
