import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountService } from './account.service';
import { RequestRefundDto } from './dto/request-refund.dto';

@ApiTags('Account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get account-level statistics for the current user' })
  async getStats(@CurrentUser() user: any) {
    return this.accountService.getStats(user.id);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'List ticket transfers sent or received by the user' })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by direction',
    enum: ['sent', 'received', 'all'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by transfer status',
    enum: ['pending', 'accepted', 'canceled'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-indexed)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Page size',
    type: Number,
  })
  async getTransfers(
    @CurrentUser() user: any,
    @Query('type') type?: 'sent' | 'received' | 'all',
    @Query('status') status?: 'pending' | 'accepted' | 'canceled',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.accountService.getTransfers(user.id, {
      type,
      status,
      page,
      limit,
    });
  }

  @Get('refunds')
  @ApiOperation({ summary: 'List refund requests for the user' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by refund status',
    enum: ['pending', 'approved', 'processed', 'failed', 'canceled'],
  })
  async listRefunds(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.accountService.getRefunds(user.id, { status, page, limit });
  }

  @Post('refunds')
  @ApiOperation({ summary: 'Request a refund for an order' })
  async requestRefund(
    @CurrentUser() user: any,
    @Body() dto: RequestRefundDto,
  ) {
    return this.accountService.requestRefund(user.id, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile including avatar' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@CurrentUser() user: any) {
    return this.accountService.getProfile(user.id);
  }

  @Get('avatar')
  @ApiOperation({ summary: 'Get current user avatar URL (refreshed signed URL for S3)' })
  @ApiResponse({ status: 200, description: 'Avatar URL retrieved successfully' })
  async getAvatar(@CurrentUser() user: any) {
    const avatarUrl = await this.accountService.getAvatarUrl(user.id);
    return { avatarUrl };
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload or update user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPEG, PNG, GIF, or WebP, max 5MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.accountService.uploadAvatar(user.id, file);
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Delete user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar deleted successfully' })
  @ApiResponse({ status: 400, description: 'No avatar to delete' })
  async deleteAvatar(@CurrentUser() user: any) {
    return this.accountService.deleteAvatar(user.id);
  }
}
