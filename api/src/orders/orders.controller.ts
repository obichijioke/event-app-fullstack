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
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  CreatePaymentDto,
  ProcessPaymentDto,
} from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for the current user' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('eventId') eventId?: string,
    @Query('orgId') orgId?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (eventId) filters.eventId = eventId;
    if (orgId) filters.orgId = orgId;

    return this.ordersService.findAll(user.id, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Order statistics retrieved successfully',
  })
  getOrderStats(
    @CurrentUser() user: any,
    @Query('eventId') eventId?: string,
    @Query('orgId') orgId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (eventId) filters.eventId = eventId;
    if (orgId) filters.orgId = orgId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    return this.ordersService.getOrderStats(user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, user.id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order canceled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancelOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.cancelOrder(id, user.id);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Initiate payment for an order' })
  @ApiResponse({ status: 200, description: 'Payment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  initiatePayment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.ordersService.initiatePayment(id, user.id, createPaymentDto);
  }

  @Post(':id/payment/process')
  @ApiOperation({ summary: 'Process payment for an order' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  processPayment(
    @CurrentUser() user: any,
    @Body() processPaymentDto: ProcessPaymentDto,
  ) {
    return this.ordersService.processPayment(processPaymentDto, user.id);
  }
}
