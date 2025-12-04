import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { EventsModule } from '../events/events.module';
import { TicketingModule } from '../ticketing/ticketing.module';
import { TicketsModule } from '../tickets/tickets.module';
import { OrdersModule } from '../orders/orders.module';
import { PayoutsModule } from '../payouts/payouts.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrganizerDashboardController } from './dashboard.controller';
import { OrganizerEventsController } from './events.controller';
import { OrganizerTicketsController } from './tickets.controller';
import { OrganizerOrdersController } from './orders.controller';
import { OrganizerAttendeesController } from './attendees.controller';
import { OrganizerFinancialsController } from './financials.controller';
import { OrganizerNotificationsController } from './notifications.controller';
import { OrganizerAnalyticsController } from './analytics.controller';
import { OrganizerSettingsController } from './settings.controller';
import { VenuesController } from './venues.controller';
import { OrganizerDisputesController } from './disputes.controller';
import { OrganizerDashboardService } from './organizer-dashboard.service';
import { OrganizerOrdersService } from './organizer-orders.service';
import { OrganizerAttendeesService } from './organizer-attendees.service';
import { OrganizerFinancialsService } from './organizer-financials.service';
import { OrganizerNotificationsService } from './organizer-notifications.service';
import { OrganizerAnalyticsService } from './organizer-analytics.service';
import { OrganizerDisputesService } from './organizer-disputes.service';
import { VenuesService } from './venues.service';

@Module({
  imports: [
    CommonModule,
    EventsModule,
    TicketingModule,
    TicketsModule,
    OrdersModule,
    PayoutsModule,
    OrganizationsModule,
    NotificationsModule,
  ],
  controllers: [
    OrganizerDashboardController,
    OrganizerEventsController,
    OrganizerTicketsController,
    OrganizerOrdersController,
    OrganizerAttendeesController,
    OrganizerFinancialsController,
    OrganizerNotificationsController,
    OrganizerAnalyticsController,
    OrganizerSettingsController,
    OrganizerDisputesController,
    VenuesController,
  ],
  providers: [
    OrganizerDashboardService,
    OrganizerOrdersService,
    OrganizerAttendeesService,
    OrganizerFinancialsService,
    OrganizerNotificationsService,
    OrganizerAnalyticsService,
    OrganizerDisputesService,
    VenuesService,
  ],
})
export class OrganizerModule {}
