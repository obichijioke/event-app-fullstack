import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GeolocationService } from './geolocation.service';
import { CommonModule } from '../common.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
    ConfigModule,
    CommonModule,
  ],
  providers: [GeolocationService],
  exports: [GeolocationService],
})
export class GeolocationModule {}
