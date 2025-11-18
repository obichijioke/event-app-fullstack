import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../common/types/user.types';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('events/:eventId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for an event' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  createEventReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createEventReview(user.id, eventId, dto);
  }

  @Patch('events/:eventId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  updateEventReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateEventReview(
      user.id,
      eventId,
      reviewId,
      dto,
    );
  }

  @Delete('events/:eventId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  deleteEventReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reviewsService.deleteEventReview(user.id, eventId, reviewId);
  }

  @Get('events/:eventId/reviews')
  @ApiOperation({ summary: 'List event reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  listEventReviews(
    @Param('eventId') eventId: string,
    @Query() query: ReviewQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return this.reviewsService.listEventReviews(eventId, page, limit);
  }

  @Get('events/:eventId/reviews/summary')
  @ApiOperation({ summary: 'Get event review summary' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  getEventReviewSummary(@Param('eventId') eventId: string) {
    return this.reviewsService.getEventReviewSummary(eventId);
  }

  @Post('organizations/:orgId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for an organization' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  createOrganizerReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orgId') orgId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createOrganizerReview(user.id, orgId, dto);
  }

  @Patch('organizations/:orgId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an organization review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  updateOrganizerReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orgId') orgId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateOrganizerReview(
      user.id,
      orgId,
      reviewId,
      dto,
    );
  }

  @Delete('organizations/:orgId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an organization review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  deleteOrganizerReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orgId') orgId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reviewsService.deleteOrganizerReview(user.id, orgId, reviewId);
  }

  @Get('organizations/:orgId/reviews')
  @ApiOperation({ summary: 'List organization reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  listOrganizerReviews(
    @Param('orgId') orgId: string,
    @Query() query: ReviewQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return this.reviewsService.listOrganizerReviews(orgId, page, limit);
  }

  @Get('organizations/:orgId/reviews/summary')
  @ApiOperation({ summary: 'Get organization review summary' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  getOrganizerReviewSummary(@Param('orgId') orgId: string) {
    return this.reviewsService.getOrganizerReviewSummary(orgId);
  }
}
