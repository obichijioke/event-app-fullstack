import {
  Controller,
  Get,
  Patch,
  Post,
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
import { AdminOrganizationService } from '../services/organization.service';
import { OrganizationQueryDto } from '../dto/query-params.dto';
import { AdminUpdateOrganizationDto } from '../dto/update-organization.dto';
import {
  SubmitForVerificationDto,
  UploadDocumentDto,
  ReviewDocumentDto,
  ApproveOrganizationDto,
  RejectOrganizationDto,
  SuspendOrganizationDto,
  AppealReviewDto,
  OrganizationVerificationQueryDto,
} from '../dto/verification.dto';

@ApiTags('Admin - Organizations')
@Controller('admin/organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminOrganizationController {
  constructor(private readonly orgService: AdminOrganizationService) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved successfully' })
  async getOrganizations(@Query() query: OrganizationQueryDto) {
    const result = await this.orgService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('verification')
  @ApiOperation({ summary: 'List organizations pending verification' })
  @ApiResponse({ status: 200, description: 'Verification queue retrieved successfully' })
  async getVerificationQueue(@Query() query: OrganizationVerificationQueryDto) {
    const result = await this.orgService.getVerificationQueue(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  async getOrganization(@Param('id') id: string) {
    const org = await this.orgService.findOne(id);
    return {
      success: true,
      data: org,
    };
  }

  @Get(':id/verification')
  @ApiOperation({ summary: 'Get organization verification details' })
  @ApiResponse({ status: 200, description: 'Verification details retrieved successfully' })
  async getVerificationDetails(@Param('id') id: string) {
    const verification = await this.orgService.getVerificationDetails(id);
    return {
      success: true,
      data: verification,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization details' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: AdminUpdateOrganizationDto,
  ) {
    const org = await this.orgService.update(id, dto);
    return {
      success: true,
      data: org,
    };
  }

  @Post(':id/verification/submit')
  @ApiOperation({ summary: 'Submit organization for verification' })
  @ApiResponse({ status: 200, description: 'Organization submitted for verification' })
  @HttpCode(HttpStatus.OK)
  async submitForVerification(
    @Param('id') id: string,
    @Body() dto: SubmitForVerificationDto,
  ) {
    const result = await this.orgService.submitForVerification(id, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/verification/documents')
  @ApiOperation({ summary: 'Upload verification document' })
  @ApiResponse({ status: 200, description: 'Document uploaded successfully' })
  @HttpCode(HttpStatus.OK)
  async uploadDocument(@Param('id') id: string, @Body() dto: UploadDocumentDto) {
    const document = await this.orgService.uploadVerificationDocument(id, dto);
    return {
      success: true,
      data: document,
    };
  }

  @Post('verification/documents/:id/review')
  @ApiOperation({ summary: 'Review verification document' })
  @ApiResponse({ status: 200, description: 'Document reviewed successfully' })
  @HttpCode(HttpStatus.OK)
  async reviewDocument(@Param('id') id: string, @Body() dto: ReviewDocumentDto) {
    const document = await this.orgService.reviewDocument(id, dto);
    return {
      success: true,
      data: document,
    };
  }

  @Post(':id/verification/approve')
  @ApiOperation({ summary: 'Approve organization verification' })
  @ApiResponse({ status: 200, description: 'Organization approved successfully' })
  @HttpCode(HttpStatus.OK)
  async approveVerification(
    @Param('id') id: string,
    @Body() dto: ApproveOrganizationDto,
  ) {
    const org = await this.orgService.approveOrganization(id, dto);
    return {
      success: true,
      data: org,
    };
  }

  @Post(':id/verification/reject')
  @ApiOperation({ summary: 'Reject organization verification' })
  @ApiResponse({ status: 200, description: 'Organization rejected' })
  @HttpCode(HttpStatus.OK)
  async rejectVerification(
    @Param('id') id: string,
    @Body() dto: RejectOrganizationDto,
  ) {
    const org = await this.orgService.rejectOrganization(id, dto);
    return {
      success: true,
      data: org,
    };
  }

  @Post(':id/verification/suspend')
  @ApiOperation({ summary: 'Suspend organization' })
  @ApiResponse({ status: 200, description: 'Organization suspended successfully' })
  @HttpCode(HttpStatus.OK)
  async suspendOrganization(
    @Param('id') id: string,
    @Body() dto: SuspendOrganizationDto,
  ) {
    const org = await this.orgService.suspendOrganization(id, dto);
    return {
      success: true,
      data: org,
    };
  }

  @Post('verification/appeals/:id/review')
  @ApiOperation({ summary: 'Review organization appeal' })
  @ApiResponse({ status: 200, description: 'Appeal reviewed successfully' })
  @HttpCode(HttpStatus.OK)
  async reviewAppeal(@Param('id') id: string, @Body() dto: AppealReviewDto) {
    const appeal = await this.orgService.reviewAppeal(id, dto);
    return {
      success: true,
      data: appeal,
    };
  }
}
