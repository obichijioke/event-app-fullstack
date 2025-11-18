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
import { AdminWebhookService } from '../services/webhook.service';
import { WebhookQueryDto, WebhookEventQueryDto } from '../dto/webhook.dto';

@ApiTags('Admin - Webhooks')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminWebhookController {
  constructor(private readonly webhookService: AdminWebhookService) {}

  @Get('webhooks')
  @ApiOperation({ summary: 'Get all webhooks with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  async getWebhooks(@Query() query: WebhookQueryDto) {
    const result = await this.webhookService.getWebhooks(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('webhooks/stats')
  @ApiOperation({ summary: 'Get webhook statistics' })
  @ApiResponse({
    status: 200,
    description: 'Webhook stats retrieved successfully',
  })
  async getWebhookStats() {
    const stats = await this.webhookService.getWebhookStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('webhooks/:id')
  @ApiOperation({ summary: 'Get webhook details' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  async getWebhook(@Param('id') id: string) {
    const webhook = await this.webhookService.getWebhook(id);
    return {
      success: true,
      data: webhook,
    };
  }

  @Get('webhook-events')
  @ApiOperation({ summary: 'Get webhook events/deliveries' })
  @ApiResponse({
    status: 200,
    description: 'Webhook events retrieved successfully',
  })
  async getWebhookEvents(@Query() query: WebhookEventQueryDto) {
    const result = await this.webhookService.getWebhookEvents(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('webhook-events/:id/retry')
  @ApiOperation({ summary: 'Retry failed webhook event' })
  @ApiResponse({
    status: 200,
    description: 'Webhook retry queued successfully',
  })
  @HttpCode(HttpStatus.OK)
  async retryWebhookEvent(@Param('id') id: string) {
    const result = await this.webhookService.retryWebhookEvent(id);
    return {
      success: true,
      ...result,
    };
  }

  @Post('webhooks/:id/test')
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Test webhook sent successfully' })
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Param('id') id: string) {
    const result = await this.webhookService.testWebhook(id);
    return {
      success: true,
      ...result,
    };
  }
}
