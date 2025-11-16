# Admin Controller Additions

## 1. Add to imports (around line 38)

```typescript
import {
  AdminSessionService,
  AdminWebhookService,
  AdminRevenueService,
  AdminModerationService,
  AdminNotificationService,
  AdminReviewService,
  AdminOrderService,
  AdminTicketService,
  AdminPromotionService,
} from './services';
```

## 2. Add to DTO imports (after line 103)

```typescript
import { SessionQueryDto } from './dto/session.dto';
import { WebhookQueryDto, WebhookEventQueryDto } from './dto/webhook.dto';
import { RevenueQueryDto } from './dto/revenue.dto';
import { FlagQueryDto, ResolveFlagDto, ModerationActionQueryDto } from './dto/moderation.dto';
import { NotificationQueryDto, BroadcastNotificationDto } from './dto/notification.dto';
import { ReviewQueryDto } from './dto/review.dto';
import { OrderAdminQueryDto, UpdateOrderStatusDto } from './dto/order.dto';
import { TicketAdminQueryDto, TransferQueryDto, CheckinQueryDto } from './dto/ticket.dto';
import { PromotionQueryDto, PromoCodeQueryDto } from './dto/promotion.dto';
```

## 3. Add to constructor (after line 132)

```typescript
    private readonly sessionService: AdminSessionService,
    private readonly webhookService: AdminWebhookService,
    private readonly revenueService: AdminRevenueService,
    private readonly moderationService: AdminModerationService,
    private readonly notificationService: AdminNotificationService,
    private readonly reviewService: AdminReviewService,
    private readonly orderService: AdminOrderService,
    private readonly ticketService: AdminTicketService,
    private readonly promotionService: AdminPromotionService,
```

## 4. Add endpoints (before line 1312 - the closing brace)

```typescript
  // Session Management
  @Get('sessions')
  @ApiOperation({ summary: 'Get all sessions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getSessions(@Query() query: SessionQueryDto) {
    const result = await this.sessionService.getSessions(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('sessions/stats')
  @ApiOperation({ summary: 'Get session statistics' })
  @ApiResponse({ status: 200, description: 'Session stats retrieved successfully' })
  async getSessionStats() {
    const stats = await this.sessionService.getSessionStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Revoke session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Param('id') id: string) {
    const result = await this.sessionService.revokeSession(id);
    return {
      success: true,
      ...result,
    };
  }

  @Post('sessions/users/:userId/revoke-all')
  @ApiOperation({ summary: 'Revoke all user sessions' })
  @ApiResponse({ status: 200, description: 'All sessions revoked successfully' })
  @HttpCode(HttpStatus.OK)
  async revokeAllUserSessions(@Param('userId') userId: string) {
    const result = await this.sessionService.revokeAllUserSessions(userId);
    return {
      success: true,
      ...result,
    };
  }

  // Webhook Management
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
  @ApiResponse({ status: 200, description: 'Webhook stats retrieved successfully' })
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
  @ApiResponse({ status: 200, description: 'Webhook events retrieved successfully' })
  async getWebhookEvents(@Query() query: WebhookEventQueryDto) {
    const result = await this.webhookService.getWebhookEvents(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('webhook-events/:id/retry')
  @ApiOperation({ summary: 'Retry failed webhook event' })
  @ApiResponse({ status: 200, description: 'Webhook retry queued successfully' })
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

  // Revenue Analytics
  @Get('revenue/overview')
  @ApiOperation({ summary: 'Get revenue overview' })
  @ApiResponse({ status: 200, description: 'Revenue overview retrieved successfully' })
  async getRevenueOverview(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueOverview(query);
    return {
      success: true,
      data,
    };
  }

  @Get('revenue/by-period')
  @ApiOperation({ summary: 'Get revenue by time period' })
  @ApiResponse({ status: 200, description: 'Revenue by period retrieved successfully' })
  async getRevenueByPeriod(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueByPeriod(query);
    return {
      success: true,
      data,
    };
  }

  @Get('revenue/by-organization')
  @ApiOperation({ summary: 'Get revenue by organization' })
  @ApiResponse({ status: 200, description: 'Revenue by organization retrieved successfully' })
  async getRevenueByOrganization(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueByOrganization(query);
    return {
      success: true,
      data,
    };
  }

  @Get('revenue/by-category')
  @ApiOperation({ summary: 'Get revenue by event category' })
  @ApiResponse({ status: 200, description: 'Revenue by category retrieved successfully' })
  async getRevenueByCategory(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueByCategory(query);
    return {
      success: true,
      data,
    };
  }

  @Get('revenue/trends')
  @ApiOperation({ summary: 'Get revenue trends' })
  @ApiResponse({ status: 200, description: 'Revenue trends retrieved successfully' })
  async getRevenueTrends(@Query() query: RevenueQueryDto) {
    const data = await this.revenueService.getRevenueTrends(query);
    return {
      success: true,
      data,
    };
  }

  // Moderation & Flags
  @Get('flags')
  @ApiOperation({ summary: 'Get all flags with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Flags retrieved successfully' })
  async getFlags(@Query() query: FlagQueryDto) {
    const result = await this.moderationService.getFlags(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('flags/stats')
  @ApiOperation({ summary: 'Get moderation statistics' })
  @ApiResponse({ status: 200, description: 'Moderation stats retrieved successfully' })
  async getModerationStats() {
    const stats = await this.moderationService.getModerationStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('flags/:id')
  @ApiOperation({ summary: 'Get flag details' })
  @ApiResponse({ status: 200, description: 'Flag retrieved successfully' })
  async getFlag(@Param('id') id: string) {
    const flag = await this.moderationService.getFlag(id);
    return {
      success: true,
      data: flag,
    };
  }

  @Post('flags/:id/resolve')
  @ApiOperation({ summary: 'Resolve flag' })
  @ApiResponse({ status: 200, description: 'Flag resolved successfully' })
  @HttpCode(HttpStatus.OK)
  async resolveFlag(
    @Param('id') id: string,
    @Body() dto: ResolveFlagDto,
    @CurrentUser() user: { id?: string },
  ) {
    const result = await this.moderationService.resolveFlag(id, dto, user?.id || '');
    return {
      success: true,
      ...result,
    };
  }

  @Get('moderation/actions')
  @ApiOperation({ summary: 'Get moderation actions' })
  @ApiResponse({ status: 200, description: 'Moderation actions retrieved successfully' })
  async getModerationActions(@Query() query: ModerationActionQueryDto) {
    const result = await this.moderationService.getModerationActions(query);
    return {
      success: true,
      data: result,
    };
  }

  // Notifications
  @Get('notifications')
  @ApiOperation({ summary: 'Get all notifications with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(@Query() query: NotificationQueryDto) {
    const result = await this.notificationService.getNotifications(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('notifications/stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Notification stats retrieved successfully' })
  async getNotificationStats() {
    const stats = await this.notificationService.getNotificationStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Post('notifications/broadcast')
  @ApiOperation({ summary: 'Broadcast notification to users' })
  @ApiResponse({ status: 200, description: 'Broadcast notification sent successfully' })
  async broadcastNotification(@Body() dto: BroadcastNotificationDto) {
    const result = await this.notificationService.broadcastNotification(dto);
    return {
      success: true,
      ...result,
    };
  }

  @Delete('notifications/:id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Param('id') id: string) {
    const result = await this.notificationService.deleteNotification(id);
    return {
      success: true,
      ...result,
    };
  }

  // Reviews
  @Get('reviews/events')
  @ApiOperation({ summary: 'Get event reviews' })
  @ApiResponse({ status: 200, description: 'Event reviews retrieved successfully' })
  async getEventReviews(@Query() query: ReviewQueryDto) {
    const result = await this.reviewService.getEventReviews(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('reviews/organizers')
  @ApiOperation({ summary: 'Get organizer reviews' })
  @ApiResponse({ status: 200, description: 'Organizer reviews retrieved successfully' })
  async getOrganizerReviews(@Query() query: ReviewQueryDto) {
    const result = await this.reviewService.getOrganizerReviews(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('reviews/stats')
  @ApiOperation({ summary: 'Get review statistics' })
  @ApiResponse({ status: 200, description: 'Review stats retrieved successfully' })
  async getReviewStats() {
    const stats = await this.reviewService.getReviewStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Delete('reviews/events/:id')
  @ApiOperation({ summary: 'Delete event review' })
  @ApiResponse({ status: 200, description: 'Event review deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteEventReview(@Param('id') id: string) {
    const result = await this.reviewService.deleteEventReview(id);
    return {
      success: true,
      ...result,
    };
  }

  @Delete('reviews/organizers/:id')
  @ApiOperation({ summary: 'Delete organizer review' })
  @ApiResponse({ status: 200, description: 'Organizer review deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteOrganizerReview(@Param('id') id: string) {
    const result = await this.reviewService.deleteOrganizerReview(id);
    return {
      success: true,
      ...result,
    };
  }

  // Orders
  @Get('orders')
  @ApiOperation({ summary: 'Get all orders with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders(@Query() query: OrderAdminQueryDto) {
    const result = await this.orderService.getOrders(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('orders/stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Order stats retrieved successfully' })
  async getOrderStats() {
    const stats = await this.orderService.getOrderStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  async getOrder(@Param('id') id: string) {
    const order = await this.orderService.getOrder(id);
    return {
      success: true,
      data: order,
    };
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const result = await this.orderService.updateOrderStatus(id, dto);
    return {
      success: true,
      ...result,
    };
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order canceled successfully' })
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Param('id') id: string) {
    const result = await this.orderService.cancelOrder(id);
    return {
      success: true,
      ...result,
    };
  }

  // Tickets
  @Get('tickets')
  @ApiOperation({ summary: 'Get all tickets with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  async getTickets(@Query() query: TicketAdminQueryDto) {
    const result = await this.ticketService.getTickets(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('tickets/stats')
  @ApiOperation({ summary: 'Get ticket statistics' })
  @ApiResponse({ status: 200, description: 'Ticket stats retrieved successfully' })
  async getTicketStats() {
    const stats = await this.ticketService.getTicketStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket details' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully' })
  async getTicket(@Param('id') id: string) {
    const ticket = await this.ticketService.getTicket(id);
    return {
      success: true,
      data: ticket,
    };
  }

  @Post('tickets/:id/void')
  @ApiOperation({ summary: 'Void ticket' })
  @ApiResponse({ status: 200, description: 'Ticket voided successfully' })
  @HttpCode(HttpStatus.OK)
  async voidTicket(@Param('id') id: string) {
    const result = await this.ticketService.voidTicket(id);
    return {
      success: true,
      ...result,
    };
  }

  @Get('tickets/transfers')
  @ApiOperation({ summary: 'Get ticket transfers' })
  @ApiResponse({ status: 200, description: 'Transfers retrieved successfully' })
  async getTransfers(@Query() query: TransferQueryDto) {
    const result = await this.ticketService.getTransfers(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('tickets/checkins')
  @ApiOperation({ summary: 'Get ticket check-ins' })
  @ApiResponse({ status: 200, description: 'Check-ins retrieved successfully' })
  async getCheckins(@Query() query: CheckinQueryDto) {
    const result = await this.ticketService.getCheckins(query);
    return {
      success: true,
      data: result,
    };
  }

  // Promotions
  @Get('promotions')
  @ApiOperation({ summary: 'Get all promotions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Promotions retrieved successfully' })
  async getPromotions(@Query() query: PromotionQueryDto) {
    const result = await this.promotionService.getPromotions(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('promotions/stats')
  @ApiOperation({ summary: 'Get promotion statistics' })
  @ApiResponse({ status: 200, description: 'Promotion stats retrieved successfully' })
  async getPromotionStats() {
    const stats = await this.promotionService.getPromotionStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('promotions/:id')
  @ApiOperation({ summary: 'Get promotion details' })
  @ApiResponse({ status: 200, description: 'Promotion retrieved successfully' })
  async getPromotion(@Param('id') id: string) {
    const promotion = await this.promotionService.getPromotion(id);
    return {
      success: true,
      data: promotion,
    };
  }

  @Post('promotions/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate promotion' })
  @ApiResponse({ status: 200, description: 'Promotion deactivated successfully' })
  @HttpCode(HttpStatus.OK)
  async deactivatePromotion(@Param('id') id: string) {
    const result = await this.promotionService.deactivatePromotion(id);
    return {
      success: true,
      ...result,
    };
  }

  @Get('promo-codes')
  @ApiOperation({ summary: 'Get all promo codes with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Promo codes retrieved successfully' })
  async getPromoCodes(@Query() query: PromoCodeQueryDto) {
    const result = await this.promotionService.getPromoCodes(query);
    return {
      success: true,
      data: result,
    };
  }
```

This completes all the controller endpoint additions needed.
