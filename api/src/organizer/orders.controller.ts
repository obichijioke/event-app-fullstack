import {
  Body,
  Controller,
  Get,
  Param,
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
import { OrganizerOrdersService } from './organizer-orders.service';
import { OrganizerOrderQueryDto } from './dto/organizer-order-query.dto';
import { OrganizerRefundDto } from './dto/organizer-refund.dto';

@ApiTags('Organizer Orders')
@Controller('organizer/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizerOrdersController {
  constructor(private readonly ordersService: OrganizerOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders for an organization' })
  @ApiQuery({ name: 'orgId', required: true })
  getOrders(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Query() query: OrganizerOrderQueryDto,
  ) {
    return this.ordersService.listOrders(orgId, user.id, query);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get order details' })
  @ApiQuery({ name: 'orgId', required: true })
  getOrder(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.getOrder(orgId, orderId, user.id);
  }

  @Post(':orderId/refund')
  @ApiOperation({ summary: 'Refund an order' })
  @ApiQuery({ name: 'orgId', required: true })
  refundOrder(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('orderId') orderId: string,
    @Body() dto: OrganizerRefundDto,
  ) {
    return this.ordersService.refundOrder(orgId, orderId, user.id, dto);
  }
}
