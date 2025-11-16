import { Module } from '@nestjs/common';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';
import { VenuesPublicController } from './venues-public.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [VenuesService],
  controllers: [VenuesController, VenuesPublicController],
  exports: [VenuesService],
})
export class VenuesModule {}
