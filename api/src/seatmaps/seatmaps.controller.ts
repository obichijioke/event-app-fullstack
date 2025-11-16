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
import { SeatmapsService } from './seatmaps.service';
import { CreateSeatmapDto, CreateSeatDto } from './dto/create-seatmap.dto';
import { UpdateSeatmapDto } from './dto/update-seatmap.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Seatmaps')
@Controller('seatmaps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SeatmapsController {
  constructor(private readonly seatmapsService: SeatmapsService) {}

  @Post('venue/:venueId')
  @ApiOperation({ summary: 'Create a new seatmap for a venue' })
  @ApiResponse({ status: 201, description: 'Seatmap created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  createForVenue(
    @CurrentUser() user: any,
    @Param('venueId') venueId: string,
    @Body() createSeatmapDto: CreateSeatmapDto,
  ) {
    return this.seatmapsService.createForVenue(
      venueId,
      user.id,
      createSeatmapDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all seatmaps for the current user' })
  @ApiResponse({ status: 200, description: 'Seatmaps retrieved successfully' })
  findAll(@CurrentUser() user: any) {
    return this.seatmapsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a seatmap by ID' })
  @ApiResponse({ status: 200, description: 'Seatmap retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Seatmap not found' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.seatmapsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a seatmap' })
  @ApiResponse({ status: 200, description: 'Seatmap updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Seatmap not found' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateSeatmapDto: UpdateSeatmapDto,
  ) {
    return this.seatmapsService.update(id, user.id, updateSeatmapDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a seatmap' })
  @ApiResponse({ status: 200, description: 'Seatmap deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Seatmap not found' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.seatmapsService.remove(id, user.id);
  }

  @Post(':id/seats')
  @ApiOperation({ summary: 'Add seats to a seatmap' })
  @ApiResponse({ status: 201, description: 'Seats added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Seatmap not found' })
  addSeats(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() seats: CreateSeatDto[],
  ) {
    return this.seatmapsService.addSeats(id, user.id, seats);
  }

  @Get(':id/seats')
  @ApiOperation({ summary: 'Get all seats for a seatmap' })
  @ApiResponse({ status: 200, description: 'Seats retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Seatmap not found' })
  getSeats(@CurrentUser() user: any, @Param('id') id: string) {
    return this.seatmapsService.getSeats(id, user.id);
  }

  @Delete('seats/:seatId')
  @ApiOperation({ summary: 'Remove a seat from a seatmap' })
  @ApiResponse({ status: 200, description: 'Seat removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Seat not found' })
  removeSeat(@CurrentUser() user: any, @Param('seatId') seatId: string) {
    return this.seatmapsService.removeSeat(seatId, user.id);
  }
}
