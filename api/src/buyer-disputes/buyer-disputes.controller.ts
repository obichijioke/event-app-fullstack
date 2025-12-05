import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { BuyerDisputesService } from './buyer-disputes.service';
import {
  CreateDisputeDto,
  AddDisputeMessageDto,
  AppealDisputeDto,
} from './dto/create-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Buyer Disputes')
@Controller('buyer/disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BuyerDisputesController {
  constructor(private readonly buyerDisputesService: BuyerDisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dispute for an order' })
  create(@CurrentUser() user: any, @Body() createDisputeDto: CreateDisputeDto) {
    return this.buyerDisputesService.create(user.sub, createDisputeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all my disputes' })
  findAll(@CurrentUser() user: any, @Query() query: DisputeQueryDto) {
    return this.buyerDisputesService.findAll(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute details' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.buyerDisputesService.findOne(user.sub, id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a message to the dispute thread' })
  addMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() addMessageDto: AddDisputeMessageDto,
  ) {
    return this.buyerDisputesService.addMessage(user.sub, id, addMessageDto);
  }

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Upload evidence for a dispute' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const disputeId = req.params.id;
          const uploadPath = `./uploads/disputes/${disputeId}`;
          // In production, this should create the directory if it doesn't exist
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  uploadEvidence(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|pdf|doc|docx|txt)$/,
          }),
        ],
      }),
    )
    file: any, // Multer file
  ) {
    return this.buyerDisputesService.uploadEvidence(user.sub, id, file);
  }

  @Post(':id/appeal')
  @ApiOperation({ summary: 'Appeal a dispute decision' })
  appeal(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() appealDto: AppealDisputeDto,
  ) {
    return this.buyerDisputesService.appeal(user.sub, id, appealDto);
  }
}
