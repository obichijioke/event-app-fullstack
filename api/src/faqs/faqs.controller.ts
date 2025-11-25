import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Event FAQs')
@Controller('events/:eventId/faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create FAQ for event (organizer only)' })
  create(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: CreateFaqDto,
  ) {
    return this.faqsService.create(eventId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all FAQs for an event (public)' })
  findAll(
    @Param('eventId') eventId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.faqsService.findByEvent(eventId, includeInactive === 'true');
  }

  @Patch(':faqId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update FAQ (organizer only)' })
  update(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Param('faqId') faqId: string,
    @Body() dto: UpdateFaqDto,
  ) {
    return this.faqsService.update(eventId, faqId, user.id, dto);
  }

  @Delete(':faqId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete FAQ (organizer only)' })
  remove(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Param('faqId') faqId: string,
  ) {
    return this.faqsService.remove(eventId, faqId, user.id);
  }

  // Search
  @Get('search')
  @ApiOperation({ summary: 'Search FAQs (public)' })
  search(
    @Param('eventId') eventId: string,
    @Query('q') query: string,
  ) {
    return this.faqsService.search(eventId, query);
  }

  // Tracking
  @Post(':faqId/view')
  @ApiOperation({ summary: 'Track FAQ view' })
  trackView(@Param('faqId') faqId: string) {
    return this.faqsService.trackView(faqId);
  }

  @Post(':faqId/helpful')
  @ApiOperation({ summary: 'Mark FAQ as helpful' })
  markHelpful(@Param('faqId') faqId: string) {
    return this.faqsService.markHelpful(faqId);
  }

  // Reordering
  @Post('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder FAQs (organizer only)' })
  reorder(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() body: { faqIds: string[] },
  ) {
    return this.faqsService.reorderFAQs(eventId, user.id, body.faqIds);
  }
}
