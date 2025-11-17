import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PlatformRole } from '@prisma/client';
import { AdminVenueCatalogService } from '../services/venue-catalog.service';
import { AdminVenuesService } from '../services/venues.service';
import {
  CreateVenueCatalogDto,
  UpdateVenueCatalogDto,
  VenueCatalogImportOptionsDto,
  VenueCatalogQueryDto,
} from '../dto/venue-catalog.dto';
import { AdminVenueQueryDto } from '../dto/venue-query.dto';

@ApiTags('Admin - Venues')
@Controller('admin/venues')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PlatformRole.admin)
@ApiBearerAuth()
export class AdminVenueController {
  constructor(
    private readonly venueCatalogService: AdminVenueCatalogService,
    private readonly venuesService: AdminVenuesService,
  ) {}

  // Venue Catalog Endpoints
  @Get('catalog')
  @ApiOperation({ summary: 'List venue catalog entries' })
  @ApiResponse({ status: 200, description: 'Catalog entries retrieved successfully' })
  async getCatalogVenues(@Query() query: VenueCatalogQueryDto) {
    const result = await this.venueCatalogService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('catalog/:id')
  @ApiOperation({ summary: 'Get venue catalog entry by ID' })
  @ApiResponse({ status: 200, description: 'Catalog entry retrieved successfully' })
  async getCatalogVenue(@Param('id') id: string) {
    const venue = await this.venueCatalogService.findOne(id);
    return {
      success: true,
      data: venue,
    };
  }

  @Post('catalog')
  @ApiOperation({ summary: 'Create venue catalog entry' })
  @ApiResponse({ status: 201, description: 'Catalog entry created successfully' })
  async createCatalogVenue(@Body() dto: CreateVenueCatalogDto) {
    const venue = await this.venueCatalogService.create(dto);
    return {
      success: true,
      data: venue,
    };
  }

  @Patch('catalog/:id')
  @ApiOperation({ summary: 'Update venue catalog entry' })
  @ApiResponse({ status: 200, description: 'Catalog entry updated successfully' })
  async updateCatalogVenue(
    @Param('id') id: string,
    @Body() dto: UpdateVenueCatalogDto,
  ) {
    const venue = await this.venueCatalogService.update(id, dto);
    return {
      success: true,
      data: venue,
    };
  }

  @Delete('catalog/:id')
  @ApiOperation({ summary: 'Delete venue catalog entry' })
  @ApiResponse({ status: 200, description: 'Catalog entry deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteCatalogVenue(@Param('id') id: string) {
    const result = await this.venueCatalogService.remove(id);
    return {
      success: true,
      ...result,
    };
  }

  @Post('catalog/import')
  @ApiOperation({ summary: 'Import venues from external sources' })
  @ApiResponse({ status: 200, description: 'Venues imported successfully' })
  @HttpCode(HttpStatus.OK)
  async importVenues(@Body() dto: VenueCatalogImportOptionsDto) {
    const result = await this.venueCatalogService.importVenues(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('catalog/bulk-upload')
  @ApiOperation({ summary: 'Bulk upload venues from CSV or JSON file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV or JSON file containing venue data',
        },
        strategy: {
          type: 'string',
          enum: ['UPSERT', 'SKIP', 'REPLACE'],
          description: 'Import strategy (default: UPSERT)',
        },
        dryRun: {
          type: 'boolean',
          description: 'Simulate import without saving (default: false)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded and venues imported successfully',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'text/csv',
          'application/json',
          'text/plain',
          'application/vnd.ms-excel',
        ];
        if (
          allowedMimeTypes.includes(file.mimetype) ||
          file.originalname.match(/\.(csv|json)$/i)
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only CSV and JSON files are allowed',
            ),
            false,
          );
        }
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async bulkUploadVenues(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Body() dto: VenueCatalogImportOptionsDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.venueCatalogService.bulkUploadFromFile(
      file.buffer,
      file.originalname,
      dto,
    );

    return {
      success: true,
      message: 'Bulk upload completed',
      data: result,
    };
  }

  // Organization Venue Endpoints
  @Get()
  @ApiOperation({ summary: 'List all organization venues' })
  @ApiResponse({ status: 200, description: 'Venues retrieved successfully' })
  async getVenues(@Query() query: AdminVenueQueryDto) {
    const result = await this.venuesService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization venue by ID' })
  @ApiResponse({ status: 200, description: 'Venue retrieved successfully' })
  async getVenue(@Param('id') id: string) {
    const venue = await this.venuesService.findOne(id);
    return {
      success: true,
      data: venue,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization venue' })
  @ApiResponse({ status: 200, description: 'Venue deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteVenue(@Param('id') id: string) {
    const result = await this.venuesService.remove(id);
    return {
      success: true,
      ...result,
    };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore deleted venue' })
  @ApiResponse({ status: 200, description: 'Venue restored successfully' })
  @HttpCode(HttpStatus.OK)
  async restoreVenue(@Param('id') id: string) {
    const venue = await this.venuesService.restore(id);
    return {
      success: true,
      data: venue,
    };
  }
}
