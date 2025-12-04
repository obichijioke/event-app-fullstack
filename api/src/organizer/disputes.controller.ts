import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrganizerDisputesService } from './organizer-disputes.service';
import {
  OrganizerDisputeQueryDto,
  SubmitDisputeResponseDto,
} from './dto/organizer-dispute.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@ApiTags('Organizer Disputes')
@Controller('organizer/disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerDisputesController {
  constructor(
    private readonly disputesService: OrganizerDisputesService,
  ) {}

  /**
   * Get all disputes for the organizer's events
   */
  @Get()
  @ApiOperation({ summary: 'List disputes for an organization' })
  async findAll(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Query() query: OrganizerDisputeQueryDto,
  ) {
    return this.disputesService.findAll(orgId, query);
  }

  /**
   * Get dispute statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get dispute statistics for an organization' })
  async getStats(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
  ) {
    return this.disputesService.getStats(orgId);
  }

  /**
   * Get a single dispute by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single dispute by ID' })
  async findOne(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.disputesService.findOne(orgId, id);
  }

  /**
   * Submit response to a dispute
   */
  @Post(':id/respond')
  @ApiOperation({ summary: 'Submit response to a dispute' })
  async submitResponse(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: SubmitDisputeResponseDto,
  ) {
    return this.disputesService.submitResponse(orgId, id, dto, user.id);
  }

  /**
   * Upload evidence for a dispute
   */
  @Post(':id/evidence')
  @ApiOperation({ summary: 'Upload evidence for a dispute' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = process.env.UPLOAD_DIR || './uploads';
          const disputeEvidencePath = `${uploadPath}/dispute-evidence`;

          // Ensure directory exists
          if (!fs.existsSync(disputeEvidencePath)) {
            fs.mkdirSync(disputeEvidencePath, { recursive: true });
          }

          cb(null, disputeEvidencePath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `dispute-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
      },
      fileFilter: (req, file, cb) => {
        // Allow common document types and images
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Allowed: PDF, images, Word, text',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadEvidence(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // File path will be relative to project root
    const fileUrl = `/${file.path}`;

    return this.disputesService.uploadEvidence(
      orgId,
      id,
      fileUrl,
      file.originalname,
      file.mimetype,
      file.size,
      user.id,
    );
  }

  /**
   * Get all evidence for a dispute
   */
  @Get(':id/evidence')
  @ApiOperation({ summary: 'Get all evidence for a dispute' })
  async getEvidence(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.disputesService.getEvidence(orgId, id);
  }

  /**
   * Delete evidence
   */
  @Delete(':id/evidence/:evidenceId')
  @ApiOperation({ summary: 'Delete evidence from a dispute' })
  async deleteEvidence(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id') id: string,
    @Param('evidenceId') evidenceId: string,
  ) {
    await this.disputesService.deleteEvidence(orgId, id, evidenceId, user.id);
    return { message: 'Evidence deleted successfully' };
  }
}
