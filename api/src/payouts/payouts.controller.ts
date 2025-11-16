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
import { PayoutsService } from './payouts.service';
import {
  CreatePayoutDto,
  CreatePayoutAccountDto,
  CalculatePayoutsDto,
} from './dto/create-payout.dto';
import {
  UpdatePayoutDto,
  UpdatePayoutAccountDto,
} from './dto/update-payout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Payouts')
@Controller('payouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  // Payout endpoints
  @Post('orgs/:orgId/payouts')
  @ApiOperation({ summary: 'Create a new payout' })
  @ApiResponse({ status: 201, description: 'Payout created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createPayout(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body() createPayoutDto: CreatePayoutDto,
  ) {
    return this.payoutsService.createPayout(orgId, user.id, createPayoutDto);
  }

  @Get('orgs/:orgId/payouts')
  @ApiOperation({ summary: 'Get all payouts for an organization' })
  @ApiResponse({ status: 200, description: 'Payouts retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAllPayouts(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    return this.payoutsService.findAllPayouts(orgId, user.id, filters);
  }

  @Get('orgs/:orgId/payouts/:id')
  @ApiOperation({ summary: 'Get a payout by ID' })
  @ApiResponse({ status: 200, description: 'Payout retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  findOnePayout(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.payoutsService.findOnePayout(id, orgId, user.id);
  }

  @Patch('orgs/:orgId/payouts/:id')
  @ApiOperation({ summary: 'Update a payout' })
  @ApiResponse({ status: 200, description: 'Payout updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  updatePayout(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() updatePayoutDto: UpdatePayoutDto,
  ) {
    return this.payoutsService.updatePayout(
      id,
      orgId,
      user.id,
      updatePayoutDto,
    );
  }

  @Delete('orgs/:orgId/payouts/:id')
  @ApiOperation({ summary: 'Delete a payout' })
  @ApiResponse({ status: 200, description: 'Payout deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  removePayout(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.payoutsService.removePayout(id, orgId, user.id);
  }

  // Payout account endpoints
  @Post('orgs/:orgId/payout-accounts')
  @ApiOperation({ summary: 'Create a new payout account' })
  @ApiResponse({
    status: 201,
    description: 'Payout account created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createPayoutAccount(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body() createPayoutAccountDto: CreatePayoutAccountDto,
  ) {
    return this.payoutsService.createPayoutAccount(
      orgId,
      user.id,
      createPayoutAccountDto,
    );
  }

  @Get('orgs/:orgId/payout-accounts')
  @ApiOperation({ summary: 'Get all payout accounts for an organization' })
  @ApiResponse({
    status: 200,
    description: 'Payout accounts retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAllPayoutAccounts(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
  ) {
    return this.payoutsService.findAllPayoutAccounts(orgId, user.id);
  }

  @Patch('orgs/:orgId/payout-accounts/:id')
  @ApiOperation({ summary: 'Update a payout account' })
  @ApiResponse({
    status: 200,
    description: 'Payout account updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payout account not found' })
  updatePayoutAccount(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() updatePayoutAccountDto: UpdatePayoutAccountDto,
  ) {
    return this.payoutsService.updatePayoutAccount(
      id,
      orgId,
      user.id,
      updatePayoutAccountDto,
    );
  }

  @Delete('orgs/:orgId/payout-accounts/:id')
  @ApiOperation({ summary: 'Delete a payout account' })
  @ApiResponse({
    status: 200,
    description: 'Payout account deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payout account not found' })
  removePayoutAccount(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.payoutsService.removePayoutAccount(id, orgId, user.id);
  }

  // Payout calculation endpoints
  @Post('orgs/:orgId/calculate-payouts')
  @ApiOperation({ summary: 'Calculate payouts for an organization' })
  @ApiResponse({ status: 200, description: 'Payouts calculated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  calculatePayouts(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Body() calculatePayoutsDto: CalculatePayoutsDto,
  ) {
    return this.payoutsService.calculatePayouts(calculatePayoutsDto, user.id);
  }

  @Get('orgs/:orgId/payout-stats')
  @ApiOperation({ summary: 'Get payout statistics for an organization' })
  @ApiResponse({
    status: 200,
    description: 'Payout statistics retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getPayoutStats(
    @CurrentUser() user: any,
    @Param('orgId') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    return this.payoutsService.getPayoutStats(orgId, user.id, filters);
  }
}
