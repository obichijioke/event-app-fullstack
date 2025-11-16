import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from '../websockets/notifications.gateway';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  getUserNotifications(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe)
    unreadOnly: boolean,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.notificationsService.getUserNotifications({
      userId: user.id,
      page,
      limit,
      unreadOnly,
      category: category as any,
      search,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@CurrentUser() user: any, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(notificationId, user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async deleteNotification(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.deleteNotification(notificationId, user.id);
    return { success: true };
  }

  // Preferences
  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Put('preferences/:category')
  @ApiOperation({ summary: 'Update notification preference for category' })
  updatePreference(
    @CurrentUser() user: any,
    @Param('category') category: string,
    @Body() data: any,
  ) {
    return this.notificationsService.updatePreference(
      user.id,
      category as any,
      data,
    );
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Bulk update notification preferences' })
  bulkUpdatePreferences(
    @CurrentUser() user: any,
    @Body() body: { preferences: any[] },
  ) {
    return this.notificationsService.bulkUpdatePreferences(
      user.id,
      body.preferences,
    );
  }

  // Bulk Actions
  @Post('bulk-read')
  @ApiOperation({ summary: 'Bulk mark notifications as read' })
  bulkMarkAsRead(
    @CurrentUser() user: any,
    @Body() body: { notificationIds: string[] },
  ) {
    return this.notificationsService.bulkMarkAsRead(
      body.notificationIds,
      user.id,
    );
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete notifications' })
  bulkDelete(
    @CurrentUser() user: any,
    @Body() body: { notificationIds: string[] },
  ) {
    return this.notificationsService.bulkDelete(body.notificationIds, user.id);
  }

  // Stats
  @Get('stats/categories')
  @ApiOperation({ summary: 'Get notification stats by category' })
  getCategoryStats(@CurrentUser() user: any) {
    return this.notificationsService.getCategoryStats(user.id);
  }

  // Test endpoint - create a test notification
  @Post('test')
  @ApiOperation({ summary: 'Create a test notification (for development)' })
  async createTestNotification(@CurrentUser() user: any) {
    const notification = await this.notificationsService.createNotification({
      userId: user.id,
      type: 'info',
      title: 'Test Notification',
      message:
        'This is a test notification to verify the system is working correctly.',
      data: { test: true },
      channels: ['in_app'],
    });

    // Emit WebSocket event for real-time notification
    try {
      this.notificationsGateway.sendToUser(
        user.id,
        'notification:new',
        notification,
      );
    } catch (error) {
      console.error('Failed to emit WebSocket event:', error);
    }

    return { success: true, notification };
  }
}
