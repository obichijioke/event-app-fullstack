import { Module } from '@nestjs/common';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
