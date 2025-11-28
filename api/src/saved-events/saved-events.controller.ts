import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SavedEventsService } from './saved-events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Saved Events')
@Controller('saved-events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SavedEventsController {
  constructor(private readonly savedEventsService: SavedEventsService) {}

  @Post(':eventId')
  @ApiOperation({ summary: 'Toggle save status for an event' })
  async toggleSave(@Request() req, @Param('eventId') eventId: string) {
    return this.savedEventsService.toggleSave(req.user.id, eventId);
  }

  @Get()
  @ApiOperation({ summary: 'Get saved events for current user' })
  async getSavedEvents(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.savedEventsService.getSavedEvents(
      req.user.id,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('ids')
  @ApiOperation({ summary: 'Get IDs of all saved events for current user' })
  async getSavedEventIds(@Request() req) {
    return this.savedEventsService.getSavedEventIds(req.user.id);
  }
}
