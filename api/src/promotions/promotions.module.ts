import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { CommonModule } from '../common/common.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [CommonModule, CurrencyModule],
  providers: [PromotionsService],
  controllers: [PromotionsController],
  exports: [PromotionsService],
})
export class PromotionsModule {}
