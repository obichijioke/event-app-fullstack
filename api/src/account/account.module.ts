import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { UserLocationService } from './user-location.service';
import { CommonModule } from '../common/common.module';
import { GeolocationModule } from '../common/geolocation/geolocation.module';

@Module({
  imports: [CommonModule, GeolocationModule],
  controllers: [AccountController],
  providers: [AccountService, UserLocationService],
  exports: [UserLocationService],
})
export class AccountModule {}
