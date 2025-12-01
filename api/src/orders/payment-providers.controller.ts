import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentService } from './services/payment.service';

@ApiTags('Payment Providers')
@Controller('payment-providers')
export class PaymentProvidersController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @ApiOperation({ summary: 'List available payment providers for checkout' })
  @ApiResponse({
    status: 200,
    description: 'Payment providers retrieved successfully',
  })
  getPaymentProviders() {
    return this.paymentService.getPaymentProviderStatuses();
  }
}
