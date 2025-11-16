import {
  BadRequestException,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { EventsService } from '../events/events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrganizerEventQueryDto } from './dto/organizer-event-query.dto';
import { OrganizerCreateEventDto } from './dto/organizer-create-event.dto';
import {
  CreateEventPoliciesDto,
  CreateEventOccurrenceDto,
} from '../events/dto/create-event.dto';
import {
  UpdateEventDto,
  UpdateEventPoliciesDto,
} from '../events/dto/update-event.dto';
import { CreateEventAssetDto } from '../events/dto/create-event-asset.dto';

@ApiTags('Organizer Events')
@Controller('organizer/events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List organization events' })
  getEvents(@CurrentUser() user: any, @Query() query: OrganizerEventQueryDto) {
    const filters: any = {
      status: query.status,
      categoryId: query.categoryId,
      orgId: query.orgId,
      upcoming: query.upcoming === 'true',
      search: query.search,
    };

    if (!filters.orgId) {
      throw new BadRequestException('orgId query parameter is required');
    }

    return this.eventsService.findAll(user.id, filters);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new event for an organization' })
  createEvent(@CurrentUser() user: any, @Body() dto: OrganizerCreateEventDto) {
    const { orgId, ...eventDto } = dto;
    return this.eventsService.createForOrg(orgId, user.id, eventDto);
  }

  @Get(':eventId')
  @ApiOperation({ summary: 'Get event details' })
  getEvent(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.eventsService.findOne(eventId, user.id);
  }

  @Patch(':eventId')
  @ApiOperation({ summary: 'Update event details' })
  updateEvent(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(eventId, user.id, dto);
  }

  @Delete(':eventId')
  @ApiOperation({ summary: 'Archive an event' })
  deleteEvent(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.eventsService.remove(eventId, user.id);
  }

  @Post(':eventId/publish')
  @ApiOperation({ summary: 'Publish an event' })
  publishEvent(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.eventsService.publish(eventId, user.id);
  }

  @Post(':eventId/pause')
  @ApiOperation({ summary: 'Pause ticket sales for an event' })
  pauseEvent(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.eventsService.pause(eventId, user.id);
  }

  @Post(':eventId/cancel')
  @ApiOperation({ summary: 'Cancel an event' })
  cancelEvent(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.eventsService.cancel(eventId, user.id);
  }

  @Post(':eventId/policies')
  @ApiOperation({ summary: 'Create event policies' })
  createPolicies(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventPoliciesDto,
  ) {
    return this.eventsService.updatePolicies(eventId, user.id, dto);
  }

  @Patch(':eventId/policies')
  @ApiOperation({ summary: 'Update event policies' })
  updatePolicies(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventPoliciesDto,
  ) {
    return this.eventsService.updatePolicies(eventId, user.id, dto);
  }

  @Post(':eventId/occurrences')
  @ApiOperation({ summary: 'Add a scheduled occurrence for an event' })
  addOccurrence(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventOccurrenceDto,
  ) {
    return this.eventsService.addOccurrence(eventId, user.id, dto);
  }

  @Get(':eventId/occurrences')
  @ApiOperation({ summary: 'List event occurrences' })
  getOccurrences(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.eventsService.getOccurrences(eventId, user.id);
  }

  @Post(':eventId/assets')
  @ApiOperation({ summary: 'Upload an event asset' })
  addAsset(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventAssetDto,
  ) {
    return this.eventsService.addAsset(eventId, user.id, dto);
  }
}
