import { Module } from '@nestjs/common';
import { GeoService } from './geo.service';
import { CommonModule } from '../common.module';

@Module({
  imports: [CommonModule],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
