import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CommonModule } from '../common/common.module';
import { PaymentService } from './services/payment.service';
import { PaystackPaymentProvider } from './providers/paystack/paystack.service';
import { StripePaymentProvider } from './providers/stripe/stripe.service';
import { PAYMENT_PROVIDERS } from './tokens';
import { TestPaymentProvider } from './providers/test/test-payment.provider';

import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports: [CommonModule, PromotionsModule],
  providers: [
    OrdersService,
    PaymentService,
    PaystackPaymentProvider,
    TestPaymentProvider,
    StripePaymentProvider,
    {
      provide: PAYMENT_PROVIDERS,
      useFactory: (
        stripeProvider: StripePaymentProvider,
        paystackProvider: PaystackPaymentProvider,
        testProvider: TestPaymentProvider,
      ) => [stripeProvider, paystackProvider, testProvider],
      inject: [
        StripePaymentProvider,
        PaystackPaymentProvider,
        TestPaymentProvider,
      ],
    },
  ],
  controllers: [OrdersController],
  exports: [
    OrdersService,
    PaymentService,
    PaystackPaymentProvider,
    StripePaymentProvider,
  ],
})
export class OrdersModule {}
