import {
  Body,
  Controller,
  Get,
  Param,
  Delete,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrganizerFinancialsService } from './organizer-financials.service';
import { OrganizerFinancialsQueryDto } from './dto/organizer-financials-query.dto';
import { OrganizerOrderQueryDto } from './dto/organizer-order-query.dto';
import { PayoutsService } from '../payouts/payouts.service';
import {
  CreatePayoutDto,
  CreatePayoutAccountDto,
} from '../payouts/dto/create-payout.dto';
import { PayoutStatus } from '@prisma/client';

@ApiTags('Organizer Financials')
@Controller('organizer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerFinancialsController {
  constructor(
    private readonly financialsService: OrganizerFinancialsService,
    private readonly payoutsService: PayoutsService,
  ) {}

  @Get('financials/summary')
  @ApiOperation({ summary: 'Get revenue summary for an organization' })
  getSummary(
    @CurrentUser() user: any,
    @Query() query: OrganizerFinancialsQueryDto,
  ) {
    return this.financialsService.getSummary(query.orgId, user.id, query);
  }

  @Get('financials/orders/export')
  @ApiOperation({ summary: 'Export orders for reconciliation' })
  @ApiQuery({ name: 'orgId', required: true })
  exportOrders(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Query() query: OrganizerOrderQueryDto,
  ) {
    return this.financialsService.exportOrders(orgId, user.id, query);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'List payouts for an organization' })
  @ApiQuery({ name: 'orgId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: PayoutStatus })
  getPayouts(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Query('status') status?: PayoutStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.payoutsService.findAllPayouts(orgId, user.id, {
      status,
      startDate,
      endDate,
    });
  }

  @Get('payouts/stats')
  @ApiOperation({ summary: 'Payout analytics for an organization' })
  @ApiQuery({ name: 'orgId', required: true })
  getPayoutStats(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.payoutsService.getPayoutStats(orgId, user.id, {
      startDate,
      endDate,
    });
  }

  @Get('payouts/:payoutId')
  @ApiOperation({ summary: 'Get a specific payout' })
  @ApiQuery({ name: 'orgId', required: true })
  getPayout(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('payoutId') payoutId: string,
  ) {
    return this.payoutsService.findOnePayout(payoutId, orgId, user.id);
  }

  @Post('payouts')
  @ApiOperation({ summary: 'Create a manual payout request' })
  @ApiQuery({ name: 'orgId', required: true })
  createPayout(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Body() dto: CreatePayoutDto,
  ) {
    return this.payoutsService.createPayout(orgId, user.id, dto);
  }

  @Post('payout-accounts')
  @ApiOperation({ summary: 'Create or update payout account information' })
  @ApiQuery({ name: 'orgId', required: true })
  createAccount(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Body() dto: CreatePayoutAccountDto,
  ) {
    return this.payoutsService.createPayoutAccount(orgId, user.id, dto);
  }

  @Get('payout-accounts')
  @ApiOperation({ summary: 'List payout accounts for an organization' })
  @ApiQuery({ name: 'orgId', required: true })
  getAccounts(@CurrentUser() user: any, @Query('orgId') orgId: string) {
    return this.payoutsService.findAllPayoutAccounts(orgId, user.id);
  }

  @Delete('payout-accounts/:accountId')
  @ApiOperation({ summary: 'Delete a payout account' })
  @ApiQuery({ name: 'orgId', required: true })
  deleteAccount(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('accountId') accountId: string,
  ) {
    return this.payoutsService.removePayoutAccount(accountId, orgId, user.id);
  }

  @Post('payouts/:payoutId/retry')
  @ApiOperation({ summary: 'Retry a failed payout' })
  @ApiQuery({ name: 'orgId', required: true })
  retryPayout(
    @CurrentUser() user: any,
    @Param('payoutId') payoutId: string,
    @Query('orgId') orgId: string,
  ) {
    return this.payoutsService.retryPayout(payoutId, orgId, user.id);
  }
}
