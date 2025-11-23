import { apiClient } from './client';
import type {
  // Dashboard Overview
  DashboardOverviewResponse,
  // Events
  EventListParams,
  CreateEventDto,
  UpdateEventDto,
  EventOccurrence,
  CreateOccurrenceDto,
  EventAsset,
  CreateAssetDto,
  // Analytics
  EventAnalytics,
  OrganizationInsights,
  // Orders & Attendees
  OrderListParams,
  OrderListResponse,
  OrderDetail,
  RefundDto,
  TransferTicketDto,
  CheckinDto,
  CheckinStats,
  RecentCheckin,
  // Notifications (Organizer - moderation)
  NotificationsResponse,
  // Notifications (User notifications)
  Notification,
  NotificationListParams,
  NotificationListResponse,
  UnreadCountResponse,
  NotificationPreference,
  UpdatePreferenceDto,
  BulkUpdatePreferencesDto,
  CategoryStats,
  BulkActionDto,
  // Financials
  FinancialSummaryParams,
  FinancialSummary,
  CreatePayoutDto,
  CreatePayoutAccountDto,
  Payout,
  PayoutAccount,
  CalculatePayoutsParams,
  CalculatePayoutsResponse,
  // Tickets & Inventory
  TicketType,
  CreateTicketTypeDto,
  UpdateTicketTypeDto,
  TicketPriceTier,
  CreateTicketPriceTierDto,
  BulkSeatAssignmentDto,
  InventorySnapshot,
  CreateHoldDto,
  Hold,
  // Promotions
  Promotion,
  CreatePromotionDto,
  PromoCode,
  CreatePromoCodeDto,
  // Organization
  Organization,
  OrganizationMember,
  CreateOrganizationDto,
  CreatePersonalOrganizationDto,
  UpdateOrganizationDto,
  AddMemberDto,
  UpdateMemberRoleDto,
  DashboardOrganization,
  DashboardEvent,
  // Venues & Seatmaps
  Venue,
  CreateVenueDto,
  UpdateVenueDto,
  VenueCatalogSearchResponse,
  Seatmap,
  CreateSeatmapDto,
  UpdateSeatmapDto,
  // API Keys
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyDto,
  // Webhooks
  Webhook,
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookEvent,
  WebhookStats,
} from '../types/organizer';

// Additional interfaces to replace 'any' types
interface EventPolicies {
  refundPolicy?: string;
  transferAllowed: boolean;
  transferCutoff?: string;
  resaleAllowed: boolean;
}

interface RefundResponse {
  success: boolean;
  refundId: string;
  message: string;
}

interface Attendee {
  id: string;
  status: string;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  ticketType: {
    id: string;
    name: string;
    kind: string;
  };
  checkedInAt?: string;
  gate?: string;
  orderId?: string;
}

interface TransferResponse {
  success: boolean;
  message: string;
  transferId?: string;
}

interface ResendResponse {
  success: boolean;
  message: string;
}

interface CheckinResponse {
  success: boolean;
  message: string;
  checkinId?: string;
  ticket?: {
    id?: string;
    owner?: {
      id?: string;
      name?: string;
      email?: string;
    };
  };
}

interface BulkSeatAssignmentResponse {
  success: boolean;
  assigned: number;
  message: string;
}

interface FlagResolutionResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Dashboard Overview
// ============================================================================

export const organizerApi = {
  // ============================================================================
  // Organizations
  // ============================================================================

  organizations: {
    // Get user's organizations
    list: () => {
      return apiClient.get<DashboardOrganization[]>('/organizations');
    },

    // Get or create default organization (personal)
    getOrCreateDefault: () => {
      return apiClient.get<Organization>('/organizations/default');
    },

    // Create a new organization
    create: (data: CreateOrganizationDto) => {
      return apiClient.post<Organization>('/organizations', data);
    },

    // Create a personal organization (simplified)
    createPersonal: (data: CreatePersonalOrganizationDto) => {
      return apiClient.post<Organization>('/organizations/personal', data);
    },

    // Get organization details
    get: (orgId: string) => {
      return apiClient.get<Organization>(`/organizations/${orgId}`);
    },

    // Update organization
    update: (orgId: string, data: UpdateOrganizationDto) => {
      return apiClient.patch<Organization>(`/organizations/${orgId}`, data);
    },

    // Delete organization
    delete: (orgId: string) => {
      return apiClient.delete(`/organizations/${orgId}`);
    },

    // Organization members
    members: {
      list: (orgId: string) => {
        return apiClient.get<OrganizationMember[]>(`/organizations/${orgId}/members`);
      },

      add: (orgId: string, data: AddMemberDto) => {
        return apiClient.post(`/organizations/${orgId}/members`, data);
      },

      updateRole: (orgId: string, userId: string, data: UpdateMemberRoleDto) => {
        return apiClient.patch(`/organizations/${orgId}/members/${userId}`, data);
      },

      remove: (orgId: string, userId: string) => {
        return apiClient.delete(`/organizations/${orgId}/members/${userId}`);
      },
    },
  },

  // Get user's organizations (legacy - kept for backward compatibility)
  getMyOrganizations: () => {
    return apiClient.get<DashboardOrganization[]>('/organizations');
  },

  // Dashboard Overview
  dashboard: {
    getOverview: (orgId: string) => {
      return apiClient.get<DashboardOverviewResponse>('/organizer/dashboard', { orgId });
    },
  },

  // ============================================================================
  // Events Management
  // ============================================================================

  events: {
    list: (params: EventListParams) => {
      const { orgId, upcoming, page, limit, ...rest } = params;
      const queryParams: Record<string, string> = { orgId, ...rest };
      if (upcoming !== undefined) queryParams.upcoming = String(upcoming);
      if (page !== undefined) queryParams.page = String(page);
      if (limit !== undefined) queryParams.limit = String(limit);
      return apiClient.get<DashboardEvent[]>('/organizer/events', queryParams);
    },

    create: (data: CreateEventDto) => {
      return apiClient.post<DashboardEvent>('/organizer/events', data);
    },

    get: (eventId: string, orgId: string) => {
      return apiClient.get<DashboardEvent>(`/organizer/events/${eventId}`, { orgId });
    },

    update: (eventId: string, data: UpdateEventDto, orgId: string) => {
      return apiClient.patch<DashboardEvent>(`/organizer/events/${eventId}`, data);
    },

    delete: (eventId: string, orgId: string) => {
      return apiClient.delete<void>(`/organizer/events/${eventId}`);
    },

    publish: (eventId: string, orgId: string) => {
      return apiClient.post<DashboardEvent>(`/organizer/events/${eventId}/publish`, { orgId });
    },

    pause: (eventId: string, orgId: string) => {
      return apiClient.post<DashboardEvent>(`/organizer/events/${eventId}/pause`, { orgId });
    },

    cancel: (eventId: string, orgId: string) => {
      return apiClient.post<DashboardEvent>(`/organizer/events/${eventId}/cancel`, { orgId });
    },

    assignSeatmap: (eventId: string, seatmapId: string) => {
      return apiClient.post<DashboardEvent>(`/organizer/events/${eventId}/seatmap`, {
        seatmapId,
      });
    },

    clearSeatmap: (eventId: string) => {
      return apiClient.delete<{ message: string }>(`/organizer/events/${eventId}/seatmap`);
    },

    // Occurrences
    occurrences: {
      list: (eventId: string, orgId: string) => {
        return apiClient.get<EventOccurrence[]>(`/organizer/events/${eventId}/occurrences`, {
          orgId,
        });
      },

      create: (eventId: string, data: CreateOccurrenceDto, orgId: string) => {
        return apiClient.post<EventOccurrence>(
          `/organizer/events/${eventId}/occurrences`,
          data
        );
      },
    },

    // Assets
    assets: {
      list: (eventId: string) => {
        return apiClient.get<EventAsset[]>(`/events/${eventId}/assets`);
      },

      create: (eventId: string, data: CreateAssetDto, orgId: string) => {
        return apiClient.post<EventAsset>(`/organizer/events/${eventId}/assets`, data);
      },
    },

    // Policies
    policies: {
      createOrUpdate: (eventId: string, data: EventPolicies, orgId: string) => {
        return apiClient.post<EventPolicies>(`/organizer/events/${eventId}/policies`, data);
      },
    },
  },

  // ============================================================================
  // Analytics
  // ============================================================================

  analytics: {
    getEventAnalytics: (eventId: string, orgId: string) => {
      return apiClient.get<EventAnalytics>(`/organizer/events/${eventId}/analytics`, { orgId });
    },

    getOrganizationInsights: (orgId: string) => {
      return apiClient.get<OrganizationInsights>('/organizer/organization/insights', { orgId });
    },
  },

  // ============================================================================
  // Orders & Attendees
  // ============================================================================

  orders: {
    list: (params: OrderListParams) => {
      const { orgId, page, limit, ...rest } = params;
      const queryParams: Record<string, string> = { orgId, ...rest };
      if (page !== undefined) queryParams.page = String(page);
      if (limit !== undefined) queryParams.limit = String(limit);
      return apiClient.get<OrderListResponse>('/organizer/orders', queryParams);
    },

    get: (orderId: string, orgId: string) => {
      return apiClient.get<OrderDetail>(`/organizer/orders/${orderId}`, { orgId });
    },

    refund: (orderId: string, data: RefundDto, orgId: string) => {
      return apiClient.post<RefundResponse>(`/organizer/orders/${orderId}/refund`, { ...data, orgId });
    },
  },

  attendees: {
    list: (eventId: string, orgId: string, params?: { search?: string; status?: string }) => {
      return apiClient.get<Attendee[]>(`/organizer/events/${eventId}/attendees`, {
        orgId,
        ...(params?.search && { search: params.search }),
        ...(params?.status && { status: params.status }),
      });
    },
  },

  tickets: {
    transfer: (ticketId: string, data: TransferTicketDto, orgId: string) => {
      return apiClient.post<TransferResponse>(`/organizer/tickets/${ticketId}/transfer`, { ...data, orgId });
    },

    resend: (ticketId: string, orgId: string) => {
      return apiClient.post<ResendResponse>(`/organizer/tickets/${ticketId}/resend`, { orgId });
    },
  },

  checkins: {
    create: (data: CheckinDto, orgId: string) => {
      return apiClient.post<CheckinResponse>('/organizer/checkins', { ...data, orgId });
    },
    getStats: (eventId: string, orgId: string) => {
      return apiClient.get<CheckinStats>(
        `/organizer/events/${eventId}/checkin-stats`,
        { orgId }
      );
    },
    getRecent: (eventId: string, orgId: string, limit?: number) => {
      return apiClient.get<RecentCheckin[]>(
        `/organizer/events/${eventId}/recent-checkins`,
        { orgId, limit }
      );
    },
  },

  // ============================================================================
  // Notifications & Moderation
  // ============================================================================

  // NOTE: Avoid name conflict with user notifications below
  orgNotifications: {
    get: (orgId: string) => {
      return apiClient.get<NotificationsResponse>('/organizer/notifications', { orgId });
    },

    resolveFlag: (flagId: string, orgId: string) => {
      return apiClient.post<FlagResolutionResponse>(`/organizer/flags/${flagId}/resolve`, { orgId });
    },
  },

  // ============================================================================
  // Tickets & Inventory
  // ============================================================================

  ticketTypes: {
    list: (eventId: string, orgId: string) => {
      return apiClient.get<TicketType[]>(`/organizer/events/${eventId}/tickets`, { orgId });
    },

    create: (eventId: string, data: CreateTicketTypeDto, orgId: string) => {
      return apiClient.post<TicketType>(`/organizer/events/${eventId}/tickets`, data);
    },

    get: (ticketTypeId: string, orgId: string) => {
      return apiClient.get<TicketType>(`/organizer/tickets/${ticketTypeId}`, { orgId });
    },

    update: (ticketTypeId: string, data: UpdateTicketTypeDto, orgId: string) => {
      return apiClient.patch<TicketType>(`/organizer/tickets/${ticketTypeId}`, data);
    },

    delete: (ticketTypeId: string, orgId: string) => {
      return apiClient.delete<void>(`/organizer/tickets/${ticketTypeId}`);
    },
  },

  priceTiers: {
    create: (ticketTypeId: string, data: CreateTicketPriceTierDto, orgId: string) => {
      return apiClient.post<TicketPriceTier>(`/organizer/tickets/${ticketTypeId}/tiers`, data);
    },

    update: (tierId: string, data: Partial<CreateTicketPriceTierDto>, orgId: string) => {
      return apiClient.patch<TicketPriceTier>(`/organizer/tiers/${tierId}`, data);
    },

    delete: (tierId: string, orgId: string) => {
      return apiClient.delete<void>(`/organizer/tiers/${tierId}`);
    },
  },

  seats: {
    bulkAssign: (ticketTypeId: string, data: BulkSeatAssignmentDto, orgId: string) => {
      return apiClient.post<BulkSeatAssignmentResponse>(`/organizer/tickets/${ticketTypeId}/seats/bulk`, data);
    },
  },

  inventory: {
    getSnapshot: (eventId: string, orgId: string) => {
      return apiClient.get<InventorySnapshot>(`/organizer/events/${eventId}/inventory`, {
        orgId,
      });
    },
  },

  holds: {
    list: (eventId: string, orgId: string) => {
      return apiClient.get<Hold[]>(`/organizer/events/${eventId}/holds`, { orgId });
    },

    create: (eventId: string, data: CreateHoldDto, orgId: string) => {
      return apiClient.post<Hold>(`/organizer/events/${eventId}/holds`, data);
    },

    delete: (holdId: string, orgId: string) => {
      return apiClient.delete<void>(`/organizer/holds/${holdId}`);
    },
  },

  // ============================================================================
  // Promotions
  // ============================================================================

  promotions: {
    list: (orgId: string) => {
      return apiClient.get<Promotion[]>(`/promotions/orgs/${orgId}/promotions`);
    },

    get: (orgId: string, promotionId: string) => {
      return apiClient.get<Promotion>(`/promotions/orgs/${orgId}/promotions/${promotionId}`);
    },

    create: (orgId: string, data: CreatePromotionDto) => {
      return apiClient.post<Promotion>(`/promotions/orgs/${orgId}/promotions`, data);
    },

    update: (orgId: string, promotionId: string, data: Partial<CreatePromotionDto>) => {
      return apiClient.patch<Promotion>(
        `/promotions/orgs/${orgId}/promotions/${promotionId}`,
        data
      );
    },

    delete: (orgId: string, promotionId: string) => {
      return apiClient.delete<void>(`/promotions/orgs/${orgId}/promotions/${promotionId}`);
    },
  },

  promoCodes: {
    list: (orgId: string, promotionId?: string) => {
      const params = promotionId ? { promotionId } : undefined;
      return apiClient.get<PromoCode[]>(`/promotions/orgs/${orgId}/promo-codes`, params);
    },

    create: (orgId: string, data: CreatePromoCodeDto) => {
      return apiClient.post<PromoCode>(`/promotions/orgs/${orgId}/promo-codes`, data);
    },

    update: (orgId: string, promoId: string, data: Partial<CreatePromoCodeDto>) => {
      return apiClient.patch<PromoCode>(`/promotions/orgs/${orgId}/promo-codes/${promoId}`, data);
    },

    delete: (orgId: string, promoId: string) => {
      return apiClient.delete<void>(`/promotions/orgs/${orgId}/promo-codes/${promoId}`);
    },
  },

  // ============================================================================
  // Organization Settings
  // ============================================================================

  organization: {
    get: (orgId: string) => {
      return apiClient.get<DashboardOrganization>('/organizer/organization', { orgId });
    },

    update: (orgId: string, data: UpdateOrganizationDto) => {
      return apiClient.patch<DashboardOrganization>('/organizer/organization', data, { orgId });
    },

    members: {
      list: (orgId: string) => {
        return apiClient.get<OrganizationMember[]>('/organizer/organization/members', { orgId });
      },

      add: (orgId: string, data: AddMemberDto) => {
        return apiClient.post<OrganizationMember>(
          `/organizer/organization/members?orgId=${orgId}`,
          data
        );
      },

      updateRole: (orgId: string, memberId: string, data: UpdateMemberRoleDto) => {
        return apiClient.patch<OrganizationMember>(
          `/organizer/organization/members/${memberId}?orgId=${orgId}`,
          data
        );
      },

      remove: (orgId: string, memberId: string) => {
        return apiClient.delete<void>(`/organizer/organization/members/${memberId}?orgId=${orgId}`);
      },
    },
  },

  // ============================================================================
  // Venues
  // ============================================================================

  venues: {
    list: (orgId: string) => {
      return apiClient.get<Venue[]>('/organizer/venues', { orgId });
    },

    get: (venueId: string, orgId: string) => {
      return apiClient.get<Venue>(`/organizer/venues/${venueId}`, { orgId });
    },

    create: (orgId: string, data: CreateVenueDto) => {
      return apiClient.post<Venue>('/organizer/venues', { ...data, orgId });
    },

    update: (venueId: string, data: UpdateVenueDto, orgId: string) => {
      return apiClient.patch<Venue>(`/organizer/venues/${venueId}?orgId=${orgId}`, data);
    },

    delete: (venueId: string, orgId: string) => {
      return apiClient.delete<void>(`/organizer/venues/${venueId}?orgId=${orgId}`);
    },

    catalogSearch: (params?: {
      search?: string;
      city?: string;
      country?: string;
      tags?: string[];
      page?: number;
      limit?: number;
    }) => {
      return apiClient.get<VenueCatalogSearchResponse>(
        '/organizer/venues/catalog/search',
        params
      );
    },
  },

  // ============================================================================
  // Seatmaps
  // ============================================================================

  seatmaps: {
    list: (orgId: string) => {
      return apiClient.get<Seatmap[]>('/seatmaps', { orgId });
    },

    get: (seatmapId: string) => {
      return apiClient.get<Seatmap>(`/seatmaps/${seatmapId}`);
    },

    create: (venueId: string, data: CreateSeatmapDto) => {
      return apiClient.post<Seatmap>(`/seatmaps/venue/${venueId}`, data);
    },

    update: (seatmapId: string, data: UpdateSeatmapDto) => {
      return apiClient.patch<Seatmap>(`/seatmaps/${seatmapId}`, data);
    },

    delete: (seatmapId: string) => {
      return apiClient.delete<void>(`/seatmaps/${seatmapId}`);
    },

    getByVenue: (venueId: string) => {
      return apiClient.get<Seatmap[]>(`/seatmaps?venueId=${venueId}`);
    },
  },

  // ============================================================================
  // Financial & Payouts
  // ============================================================================

  financials: {
    getSummary: (orgId: string, params?: FinancialSummaryParams) => {
      const queryParams: Record<string, string> = { orgId };
      if (params?.startDate) queryParams.startDate = params.startDate;
      if (params?.endDate) queryParams.endDate = params.endDate;
      return apiClient.get<FinancialSummary>('/organizer/financials/summary', queryParams);
    },

    exportOrders: (orgId: string, params?: { startDate?: string; endDate?: string }) => {
      return apiClient.get<Blob>('/organizer/financials/orders/export', {
        orgId,
        ...params,
      });
    },
  },

  payouts: {
    list: (
      orgId: string,
      params?: { status?: string; startDate?: string; endDate?: string }
    ) => {
      return apiClient.get<Payout[]>('/organizer/payouts', { orgId, ...params });
    },

    get: (payoutId: string, orgId: string) => {
      return apiClient.get<Payout>(`/organizer/payouts/${payoutId}`, { orgId });
    },

    create: (data: CreatePayoutDto, orgId: string) => {
      return apiClient.post<Payout>('/organizer/payouts', { ...data, orgId });
    },

    createAccount: (data: CreatePayoutAccountDto, orgId: string) => {
      return apiClient.post<PayoutAccount>('/organizer/payout-accounts', { ...data, orgId });
    },

    listAccounts: (orgId: string) => {
      return apiClient.get<PayoutAccount[]>('/organizer/payout-accounts', { orgId });
    },

    deleteAccount: (accountId: string, orgId: string) => {
      return apiClient.delete<{ message: string }>(
        `/organizer/payout-accounts/${accountId}?orgId=${orgId}`
      );
    },

    retry: (payoutId: string, orgId: string) => {
      return apiClient.post<Payout>(`/organizer/payouts/${payoutId}/retry`, { orgId });
    },
  },

  // ============================================================================
  // API Keys
  // ============================================================================

  apiKeys: {
    // List all API keys
    list: () => {
      return apiClient.get<ApiKey[]>('/auth/api-keys');
    },

    // Create a new API key
    create: (data: CreateApiKeyDto) => {
      return apiClient.post<ApiKeyWithSecret>('/auth/api-keys', data);
    },

    // Revoke/delete an API key
    revoke: (keyId: string) => {
      return apiClient.delete<{ message: string }>(`/auth/api-keys/${keyId}`);
    },
  },

  // ============================================================================
  // Webhooks
  // ============================================================================

  webhooks: {
    // List all webhooks for an organization
    list: (orgId: string) => {
      return apiClient.get<Webhook[]>(`/webhooks/orgs/${orgId}/webhooks`);
    },

    // Get a specific webhook
    get: (orgId: string, webhookId: string) => {
      return apiClient.get<Webhook>(`/webhooks/orgs/${orgId}/webhooks/${webhookId}`);
    },

    // Create a new webhook
    create: (orgId: string, data: CreateWebhookDto) => {
      return apiClient.post<Webhook>(`/webhooks/orgs/${orgId}/webhooks`, data);
    },

    // Update a webhook
    update: (orgId: string, webhookId: string, data: UpdateWebhookDto) => {
      return apiClient.patch<Webhook>(`/webhooks/orgs/${orgId}/webhooks/${webhookId}`, data);
    },

    // Delete a webhook
    delete: (orgId: string, webhookId: string) => {
      return apiClient.delete<{ message: string }>(`/webhooks/orgs/${orgId}/webhooks/${webhookId}`);
    },

    // Get webhook events
    getEvents: (orgId: string, webhookId: string, params?: {
      status?: string;
      eventType?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      return apiClient.get<WebhookEvent[]>(`/webhooks/orgs/${orgId}/webhooks/${webhookId}/events`, params);
    },

    // Get webhook statistics
    getStats: (orgId: string, webhookId: string, params?: {
      startDate?: string;
      endDate?: string;
    }) => {
      return apiClient.get<WebhookStats>(`/webhooks/orgs/${orgId}/webhooks/${webhookId}/stats`, params);
    },

    // Retry a webhook event
    retryEvent: (orgId: string, webhookId: string, eventId: string) => {
      return apiClient.post<{ message: string }>(`/webhooks/orgs/${orgId}/webhooks/${webhookId}/events/${eventId}/retry`, {});
    },
  },

  // ============================================================================
  // Notifications (User in-app notifications)
  // ============================================================================

  notifications: {
    // Get user notifications (with filters)
    list: (params?: NotificationListParams) => {
      const p: Record<string, unknown> | undefined = params
        ? {
            page: params.page,
            limit: params.limit,
            unreadOnly: params.unreadOnly,
            category: params.category,
            search: params.search,
          }
        : undefined;
      return apiClient.get<NotificationListResponse>('/notifications', p);
    },

    // Get unread count
    getUnreadCount: () => {
      return apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    },

    // Mark notification as read
    markAsRead: (notificationId: string) => {
      return apiClient.post<Notification>(`/notifications/${notificationId}/read`, {});
    },

    // Mark all as read
    markAllAsRead: () => {
      return apiClient.post<{ count: number }>('/notifications/read-all', {});
    },

    // Delete notification
    delete: (notificationId: string) => {
      return apiClient.delete<{ success: boolean }>(`/notifications/${notificationId}`);
    },

    // ========== Phase 3: Preferences ==========

    // Get notification preferences
    getPreferences: () => {
      return apiClient.get<NotificationPreference[]>('/notifications/preferences');
    },

    // Update single category preference
    updatePreference: (category: string, data: UpdatePreferenceDto) => {
      return apiClient.put<NotificationPreference>(`/notifications/preferences/${category}`, data);
    },

    // Bulk update preferences
    bulkUpdatePreferences: (data: BulkUpdatePreferencesDto) => {
      return apiClient.put<{ count: number }>('/notifications/preferences', data);
    },

    // ========== Phase 3: Bulk Actions ==========

    // Bulk mark as read
    bulkMarkAsRead: (data: BulkActionDto) => {
      return apiClient.post<{ count: number }>('/notifications/bulk-read', data);
    },

    // Bulk delete
    bulkDelete: (data: BulkActionDto) => {
      return apiClient.post<{ count: number }>('/notifications/bulk-delete', data);
    },

    // ========== Phase 3: Stats ==========

    // Get category stats
    getCategoryStats: () => {
      return apiClient.get<CategoryStats[]>('/notifications/stats/categories');
    },
  },
};
