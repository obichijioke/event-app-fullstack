import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import {
  CreateWebhookDto,
  CreateWebhookEventDto,
} from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  // Webhook endpoints
  @Post('orgs/:orgId/webhooks')
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createWebhook(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body() createWebhookDto: CreateWebhookDto,
  ) {
    return this.webhooksService.createWebhook(orgId, user.id, createWebhookDto);
  }

  @Get('orgs/:orgId/webhooks')
  @ApiOperation({ summary: 'Get all webhooks for an organization' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAllWebhooks(@CurrentUser() user: any, @Param('orgId') orgId: string) {
    return this.webhooksService.findAllWebhooks(orgId, user.id);
  }

  @Get('orgs/:orgId/webhooks/:id')
  @ApiOperation({ summary: 'Get a webhook by ID' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  findOneWebhook(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.webhooksService.findOneWebhook(id, orgId, user.id);
  }

  @Patch('orgs/:orgId/webhooks/:id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  updateWebhook(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ) {
    return this.webhooksService.updateWebhook(
      id,
      orgId,
      user.id,
      updateWebhookDto,
    );
  }

  @Delete('orgs/:orgId/webhooks/:id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  removeWebhook(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.webhooksService.removeWebhook(id, orgId, user.id);
  }

  // Webhook event endpoints
  @Get('orgs/:orgId/webhooks/:webhookId/events')
  @ApiOperation({ summary: 'Get all events for a webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook events retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  getWebhookEvents(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('webhookId') webhookId: string,
    @Query('status') status?: string,
    @Query('eventType') eventType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (eventType) filters.eventType = eventType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    return this.webhooksService.getWebhookEvents(
      webhookId,
      orgId,
      user.id,
      filters,
    );
  }

  @Post('orgs/:orgId/webhooks/:webhookId/events/:eventId/retry')
  @ApiOperation({ summary: 'Retry a webhook event' })
  @ApiResponse({ status: 200, description: 'Webhook event retry initiated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook event not found' })
  retryWebhookEvent(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('webhookId') webhookId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.webhooksService.retryWebhookEvent(eventId, orgId, user.id);
  }

  @Post('orgs/:orgId/trigger-webhook')
  @ApiOperation({ summary: 'Trigger a webhook event' })
  @ApiResponse({
    status: 201,
    description: 'Webhook event triggered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  triggerWebhook(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body() createWebhookEventDto: CreateWebhookEventDto,
  ) {
    return this.webhooksService.triggerWebhook(
      createWebhookEventDto,
      orgId,
      user.id,
    );
  }

  @Get('orgs/:orgId/webhooks/:webhookId/stats')
  @ApiOperation({ summary: 'Get webhook statistics' })
  @ApiResponse({
    status: 200,
    description: 'Webhook statistics retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  getWebhookStats(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('webhookId') webhookId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    return this.webhooksService.getWebhookStats(
      webhookId,
      orgId,
      user.id,
      filters,
    );
  }

  // Public endpoint for receiving webhook responses
  @Post('webhook-responses/:webhookId')
  @ApiOperation({ summary: 'Receive webhook response' })
  @ApiResponse({ status: 200, description: 'Webhook response received' })
  receiveWebhookResponse(
    @Param('webhookId') webhookId: string,
    @Body() response: any,
  ) {
    // This endpoint would be used to receive responses from webhook consumers
    // It could be used to verify delivery or handle callbacks
    return { message: 'Webhook response received', webhookId, response };
  }
}
