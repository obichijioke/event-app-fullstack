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
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Venues')
@Controller('venues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new venue' })
  @ApiResponse({ status: 201, description: 'Venue created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@CurrentUser() user: any, @Body() createVenueDto: CreateVenueDto) {
    return this.venuesService.create(user.id, createVenueDto);
  }

  @Post('org/:orgId')
  @ApiOperation({ summary: 'Create a new venue for an organization' })
  @ApiResponse({ status: 201, description: 'Venue created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createForOrg(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body() createVenueDto: CreateVenueDto,
  ) {
    return this.venuesService.createForOrg(orgId, user.id, createVenueDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all venues for the current user' })
  @ApiResponse({ status: 200, description: 'Venues retrieved successfully' })
  findAll(@CurrentUser() user: any) {
    return this.venuesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a venue by ID' })
  @ApiResponse({ status: 200, description: 'Venue retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.venuesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a venue' })
  @ApiResponse({ status: 200, description: 'Venue updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
  ) {
    return this.venuesService.update(id, user.id, updateVenueDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a venue' })
  @ApiResponse({ status: 200, description: 'Venue deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.venuesService.remove(id, user.id);
  }
}
