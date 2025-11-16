import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { PublicOrganizerDto } from './dto/public-organizer.dto';

@ApiTags('Organizers (Public)')
@Controller('organizers')
export class OrganizationsPublicController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all public organizers with basic info and upcoming events',
  })
  @ApiResponse({
    status: 200,
    description: 'List of public organizers',
    type: [PublicOrganizerDto],
  })
  findAll() {
    return this.organizationsService.findAllPublic();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single public organizer by ID' })
  @ApiResponse({
    status: 200,
    description: 'Organizer profile with upcoming events',
    type: PublicOrganizerDto,
  })
  @ApiResponse({ status: 404, description: 'Organizer not found' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOnePublic(id);
  }
}
