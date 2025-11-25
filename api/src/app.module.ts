import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { VenuesModule } from './venues/venues.module';
import { SeatmapsModule } from './seatmaps/seatmaps.module';
import { EventsModule } from './events/events.module';
import { TicketingModule } from './ticketing/ticketing.module';
import { OrdersModule } from './orders/orders.module';
import { TicketsModule } from './tickets/tickets.module';
import { PromotionsModule } from './promotions/promotions.module';
import { PayoutsModule } from './payouts/payouts.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ModerationModule } from './moderation/moderation.module';
import { QueuesModule } from './queues/queues.module';
import { HealthModule } from './health/health.module';
import { HomepageModule } from './homepage/homepage.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CategoriesModule } from './categories/categories.module';
import { AdminModule } from './admin/admin.module';
import { OrganizerModule } from './organizer/organizer.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { EventCreatorV2Module } from './event-creator-v2/event-creator-v2.module';
import { CurrencyModule } from './currency/currency.module';
import { AccountModule } from './account/account.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { FaqsModule } from './faqs/faqs.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    AuthModule,
    OrganizationsModule,
    VenuesModule,
    SeatmapsModule,
    EventsModule,
    TicketingModule,
    OrdersModule,
    TicketsModule,
    PromotionsModule,
    PayoutsModule,
    WebhooksModule,
    ModerationModule,
    QueuesModule,
    HealthModule,
    HomepageModule,
    ReviewsModule,
    CategoriesModule,
    AdminModule,
    OrganizerModule,
    NotificationsModule,
    WebsocketsModule,
    EventCreatorV2Module,
    CurrencyModule,
    AccountModule,
    AnnouncementsModule,
    FaqsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
