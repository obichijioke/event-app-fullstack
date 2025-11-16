import {
  Body,
  Controller,
  Delete,
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
import { AdminNotificationService } from '../services/notification.service';
import { NotificationQueryDto, BroadcastNotificationDto } from '../dto/notification.dto';

@ApiTags('Admin - Notifications')
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminNotificationController {
  constructor(private readonly notificationService: AdminNotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(@Query() query: NotificationQueryDto) {
    const result = await this.notificationService.getNotifications(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Notification stats retrieved successfully' })
  async getNotificationStats() {
    const stats = await this.notificationService.getNotificationStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast notification to users' })
  @ApiResponse({ status: 200, description: 'Broadcast notification sent successfully' })
  async broadcastNotification(@Body() dto: BroadcastNotificationDto) {
    const result = await this.notificationService.broadcastNotification(dto);
    return {
      success: true,
      ...result,
    };
  }

  @Delete(':id')
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
}
