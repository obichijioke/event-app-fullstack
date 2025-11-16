import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import {
  AdminOrganizationService,
  AdminUserService,
  AdminEventService,
  AdminPaymentService,
  AdminPayoutService,
  AdminRefundService,
  AdminCategoryService,
  AdminAuditService,
  AdminSettingsService,
  AdminVenueCatalogService,
  AdminVenuesService,
} from './services';
import { CommonModule } from '../common/common.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [CommonModule, QueuesModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminOrganizationService,
    AdminUserService,
    AdminEventService,
    AdminPaymentService,
    AdminPayoutService,
    AdminRefundService,
    AdminCategoryService,
    AdminAuditService,
    AdminSettingsService,
    AdminVenueCatalogService,
    AdminVenuesService,
  ],
})
export class AdminModule {}
