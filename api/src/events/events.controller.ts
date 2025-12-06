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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  CreateEventOccurrenceDto,
} from './dto/create-event.dto';
import { UpdateEventDto, UpdateEventPoliciesDto } from './dto/update-event.dto';
import { CreateEventAssetDto } from './dto/create-event-asset.dto';
import { NearbyEventsDto } from './dto/nearby-events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Request } from 'express';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('org/:orgId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event for an organization' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createForOrg(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventsService.createForOrg(orgId, user.id, createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get public events' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'following',
    required: false,
    type: Boolean,
    description:
      'Filter events from followed organizations (requires authentication)',
  })
  findPublic(
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('upcoming') upcoming?: string,
    @Query('search') search?: string,
    @Query('following') following?: string,
    @Req() req?: Request,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (categoryId) filters.categoryId = categoryId;
    if (upcoming === 'true') filters.upcoming = true;
    if (search) filters.search = search;
    if (following === 'true') filters.following = true;

    // Extract user ID from request if authenticated
    const userId = (req as any).user?.id;

    return this.eventsService.findPublic(filters, userId);
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Find events near a location',
    description:
      'Search for events near coordinates or a city. Supports both lat/lon and city-based search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby events retrieved successfully',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    type: Number,
    description: 'Latitude (required if city not provided)',
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    type: Number,
    description: 'Longitude (required if city not provided)',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    type: String,
    description: 'City name or ID (alternative to lat/lon)',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Radius in kilometers (default: 50, max: 500)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findNearby(@Query() query: NearbyEventsDto) {
    // If city is provided, use city-based search
    if (query.city) {
      return this.eventsService.findNearbyByCity(
        query.city,
        query.radius,
        query.page,
        query.limit,
        query.categoryId ? { categoryId: query.categoryId } : undefined,
      );
    }

    // Otherwise use lat/lon search (validated by DTO when city is not provided)
    return this.eventsService.findNearby(
      query.latitude!,
      query.longitude!,
      query.radius,
      query.page,
      query.limit,
      query.categoryId ? { categoryId: query.categoryId } : undefined,
    );
  }

  @Get('nearby/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Find events near the current user',
    description:
      "Search for events near the user's stored location. Requires user to have set their location.",
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby events retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User location not set',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Radius in kilometers (default: 50, max: 500)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findNearbyForUser(
    @CurrentUser() user: any,
    @Query('radius') radius?: number,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.eventsService.findNearbyForUser(
      user.id,
      radius ?? 50,
      page ?? 1,
      limit ?? 20,
      categoryId ? { categoryId } : undefined,
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get events for the current user' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('orgId') orgId?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (categoryId) filters.categoryId = categoryId;
    if (orgId) filters.orgId = orgId;
    if (upcoming === 'true') filters.upcoming = true;

    return this.eventsService.findAll(user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.eventsService.findOne(id, user?.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, user.id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.eventsService.remove(id, user.id);
  }

  @Patch(':id/policies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event policies' })
  @ApiResponse({
    status: 200,
    description: 'Event policies updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  updatePolicies(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() policiesDto: UpdateEventPoliciesDto,
  ) {
    return this.eventsService.updatePolicies(id, user.id, policiesDto);
  }

  @Post(':id/occurrences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an occurrence to an event' })
  @ApiResponse({ status: 201, description: 'Occurrence added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  addOccurrence(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() occurrenceDto: CreateEventOccurrenceDto,
  ) {
    return this.eventsService.addOccurrence(id, user.id, occurrenceDto);
  }

  @Get(':id/occurrences')
  @ApiOperation({ summary: 'Get all occurrences for an event' })
  @ApiResponse({
    status: 200,
    description: 'Occurrences retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getOccurrences(@CurrentUser() user: any, @Param('id') id: string) {
    return this.eventsService.getOccurrences(id, user?.id);
  }

  @Post(':id/assets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an asset to an event' })
  @ApiResponse({ status: 201, description: 'Asset added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  addAsset(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() createAssetDto: CreateEventAssetDto,
  ) {
    return this.eventsService.addAsset(id, user.id, createAssetDto);
  }

  @Get(':id/assets')
  @ApiOperation({ summary: 'Get all assets for an event' })
  @ApiResponse({
    status: 200,
    description: 'Assets retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getAssets(@Param('id') id: string) {
    return this.eventsService.getAssets(id);
  }

  @Delete(':id/assets/:assetId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an asset from an event' })
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  deleteAsset(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('assetId') assetId: string,
  ) {
    return this.eventsService.deleteAsset(id, assetId, user.id);
  }
}
