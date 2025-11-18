import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
}
