import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { AdminReviewService } from '../services/review.service';
import { ReviewQueryDto } from '../dto/review.dto';

@ApiTags('Admin - Reviews')
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminReviewController {
  constructor(private readonly reviewService: AdminReviewService) {}

  @Get('events')
  @ApiOperation({ summary: 'Get event reviews' })
  @ApiResponse({ status: 200, description: 'Event reviews retrieved successfully' })
  async getEventReviews(@Query() query: ReviewQueryDto) {
    const result = await this.reviewService.getEventReviews(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('organizers')
  @ApiOperation({ summary: 'Get organizer reviews' })
  @ApiResponse({ status: 200, description: 'Organizer reviews retrieved successfully' })
  async getOrganizerReviews(@Query() query: ReviewQueryDto) {
    const result = await this.reviewService.getOrganizerReviews(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics' })
  @ApiResponse({ status: 200, description: 'Review stats retrieved successfully' })
  async getReviewStats() {
    const stats = await this.reviewService.getReviewStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Delete('events/:id')
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

  @Delete('organizers/:id')
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
}
