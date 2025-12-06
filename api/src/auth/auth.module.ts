import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { SessionCleanupService } from './session-cleanup.service';
import { CommonModule } from '../common/common.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [
    CommonModule,
    PassportModule,
    forwardRef(() => OrganizationsModule),
    AccountModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }

        return {
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    SessionCleanupService,
  ],
  controllers: [AuthController],
  exports: [AuthService, SessionCleanupService],
})
export class AuthModule {}
