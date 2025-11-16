import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VenuesService } from './venues.service';

@ApiTags('Venues (Public)')
@Controller('venues-public')
export class VenuesPublicController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all venues (public)' })
  @ApiResponse({ status: 200, description: 'Venues retrieved successfully' })
  findAll() {
    return this.venuesService.findAllPublic();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a venue by ID (public)' })
  @ApiResponse({ status: 200, description: 'Venue retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  findOne(@Param('id') id: string) {
    return this.venuesService.findOnePublic(id);
  }
}
