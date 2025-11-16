import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UserFollowsService } from './user-follows.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsPublicController } from './organizations-public.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [OrganizationsService, UserFollowsService],
  controllers: [OrganizationsController, OrganizationsPublicController],
  exports: [OrganizationsService, UserFollowsService],
})
export class OrganizationsModule {}
