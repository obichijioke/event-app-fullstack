"use client";

import { apiClient, ApiError } from "@/lib/api-client";
import { buildQueryString } from "@/lib/utils/query-builder";
import { API_BASE_URL } from "@/lib/config";

// Base types for admin API responses
export interface AdminApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface AdminListResponse<T> extends AdminApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminMetrics {
  totalUsers: number;
  activeEvents: number;
  totalRevenue: number;
  conversionRate: number;
  userGrowth: number;
  eventGrowth: number;
  revenueGrowth: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: "attendee" | "organizer" | "moderator" | "admin";
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerifiedAt?: string;
}

export interface AdminOrganization {
  id: string;
  name: string;
  legalName?: string;
  website?: string;
  country?: string;
  supportEmail?: string;
  taxId?: string;
  status: string;
  ownerId: string;
  memberCount: number;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEvent {
  id: string;
  title: string;
  description?: string;
  status:
    | "draft"
    | "pending"
    | "approved"
    | "live"
    | "paused"
    | "ended"
    | "canceled";
  visibility: "public" | "unlisted" | "private";
  startAt: string;
  endAt: string;
  categoryId?: string;
  organizerId: string;
  organizerName: string;
  venueId?: string;
  venueName?: string;
  ticketCount: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPayment {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  eventId: string;
  eventTitle: string;
  amountCents: number;
  currency: string;
  status: "requires_action" | "authorized" | "captured" | "voided" | "failed";
  provider: string;
  providerIntent?: string;
  providerCharge?: string;
  capturedAt?: string;
  failureCode?: string;
  failureMessage?: string;
  createdAt: string;
}

export interface AdminPayout {
  id: string;
  orgId: string;
  orgName: string;
  amountCents: number;
  currency: string;
  status: "pending" | "in_review" | "paid" | "failed";
  scheduledFor?: string;
  initiatedAt?: string;
  provider?: string;
  providerRef?: string;
  failureReason?: string;
  createdAt: string;
}

export interface AdminActivityLog {
  id: string;
  actorId?: string;
  actorName?: string;
  action: string;
  targetKind: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminRefund {
  id: string;
  orderId: string;
  amountCents: number;
  currency: string;
  reason?: string;
  status: "pending" | "approved" | "processed" | "failed" | "canceled";
  createdBy?: string;
  createdAt: string;
  processedAt?: string;
  providerRef?: string;
  orderTotal: number;
  orderStatus: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  eventId: string;
  eventTitle: string;
  creatorName: string;
}

export interface AdminVenueCatalogEntry {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  address: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };
  timezone: string;
  capacityMin?: number | null;
  capacityMax?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminVenueRecord {
  id: string;
  name: string;
  address: Record<string, unknown>;
  timezone: string;
  capacity?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  visibility: string;
  status: 'active' | 'archived';
  deletedAt?: string | null;
  organization: {
    id: string;
    name: string;
  };
  catalogVenue?: {
    id: string;
    name: string;
    imageUrl?: string | null;
  } | null;
  seatmapCount: number;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDispute {
  id: string;
  orderId: string;
  provider: string;
  caseId: string;
  status: 'needs_response' | 'under_review' | 'won' | 'lost' | 'warning' | 'charge_refunded';
  amountCents?: number;
  reason?: string;
  openedAt: string;
  closedAt?: string;
  orderTotal: number;
  orderCurrency: string;
  orderStatus: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  eventId: string;
  eventTitle: string;
  orgId: string;
  orgName: string;
}

export interface AdminDisputeStats {
  total: number;
  needsResponse: number;
  underReview: number;
  won: number;
  lost: number;
  totalAmountCents: number;
  winRate: string;
}

export interface AdminFeeSchedule {
  id: string;
  kind: 'platform' | 'processing';
  name: string;
  percent: number;
  fixedCents: number;
  currency?: string;
  active: boolean;
  createdAt: string;
  orgFeeOverrides?: AdminOrgFeeOverride[];
}

export interface AdminOrgFeeOverride {
  id: string;
  orgId: string;
  feeScheduleId: string;
  startsAt?: string;
  endsAt?: string;
  org: {
    id: string;
    name: string;
  };
  feeSchedule?: AdminFeeSchedule;
}

export interface AdminFeeScheduleStats {
  total: number;
  activePlatform: number;
  activeProcessing: number;
  totalOverrides: number;
}

export interface AdminTaxRate {
  id: string;
  country: string;
  region?: string;
  city?: string;
  postal?: string;
  rate: number;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface AdminTaxRateStats {
  total: number;
  active: number;
  countriesCount: number;
  averageRate: string;
}

// Orders
export interface AdminOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  eventId: string;
  eventTitle: string;
  orgId: string;
  orgName: string;
  amountCents: number;
  currency: string;
  status: 'pending' | 'paid' | 'canceled' | 'refunded' | 'chargeback';
  paymentStatus: string;
  ticketCount: number;
  createdAt: string;
  paidAt?: string;
}

export interface AdminOrderStats {
  total: number;
  pending: number;
  paid: number;
  canceled: number;
  refunded: number;
  totalRevenueCents: number;
}

// Tickets
export interface AdminTicket {
  id: string;
  ticketCode: string;
  orderId: string;
  eventId: string;
  eventTitle: string;
  ticketTypeId: string;
  ticketTypeName: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  status: 'issued' | 'transferred' | 'refunded' | 'checked_in' | 'void';
  priceCents: number;
  currency: string;
  checkedInAt?: string;
  transferredAt?: string;
  createdAt: string;
}

export interface AdminTicketStats {
  total: number;
  issued: number;
  checkedIn: number;
  transferred: number;
  refunded: number;
  void: number;
}

export interface AdminTicketTransfer {
  id: string;
  ticketId: string;
  fromUserId: string;
  fromUserEmail: string;
  toUserId: string;
  toUserEmail: string;
  status: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface AdminTicketCheckin {
  id: string;
  ticketId: string;
  ticketCode: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  checkedInAt: string;
  checkedInBy?: string;
}

// Notifications
export interface AdminNotification {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  channels: ('in_app' | 'email' | 'push' | 'sms')[];
  title: string;
  message: string;
  data?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

export interface AdminNotificationStats {
  total: number;
  read: number;
  unread: number;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
}

// Reviews
export interface AdminEventReview {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrganizerReview {
  id: string;
  orgId: string;
  orgName: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewStats {
  totalEventReviews: number;
  totalOrganizerReviews: number;
  avgEventRating: string;
  avgOrganizerRating: string;
}

// Promotions
export interface AdminPromotion {
  id: string;
  eventId: string;
  eventTitle: string;
  orgId: string;
  orgName: string;
  name: string;
  description?: string;
  status: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface AdminPromoCode {
  id: string;
  code: string;
  promotionId?: string;
  promotionName?: string;
  eventId?: string;
  eventTitle?: string;
  discountType: string;
  discountValue: number;
  usageLimit?: number;
  usageCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

export interface AdminPromotionStats {
  totalPromotions: number;
  activePromotions: number;
  totalPromoCodes: number;
  activePromoCodes: number;
  totalRedemptions: number;
}

// Moderation/Flags
export interface AdminFlag {
  id: string;
  targetKind: string;
  targetId: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  description?: string;
  status: 'open' | 'needs_changes' | 'approved' | 'rejected' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AdminModerationAction {
  id: string;
  flagId: string;
  actorId: string;
  actorName: string;
  action: string;
  note?: string;
  createdAt: string;
}

export interface AdminModerationStats {
  total: number;
  open: number;
  resolved: number;
  rejected: number;
  averageResolutionTime: string;
}

// Sessions
export interface AdminSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAgent?: string;
  ipAddress?: string;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface AdminSessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  activeUsers: number;
}

// Revenue
export interface AdminRevenueMetrics {
  totalRevenueCents: number;
  platformFeeCents: number;
  processingFeeCents: number;
  organizerPayoutCents: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  ticketCount: number;
  refundCount: number;
  refundAmountCents: number;
}

export interface AdminRevenueBreakdown {
  byEvent: Array<{
    eventId: string;
    eventTitle: string;
    revenueCents: number;
    orderCount: number;
  }>;
  byOrganizer: Array<{
    orgId: string;
    orgName: string;
    revenueCents: number;
    orderCount: number;
  }>;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    revenueCents: number;
    orderCount: number;
  }>;
}

// Webhooks
export interface AdminWebhook {
  id: string;
  orgId: string;
  orgName: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWebhookEvent {
  id: string;
  webhookId: string;
  webhookUrl: string;
  orgId: string;
  eventType: string;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  responseCode?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface AdminWebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  successRate: string;
}

// Organization Verification
export interface AdminVerificationDocument {
  id: string;
  orgId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewNote?: string;
  uploadedAt: string;
  reviewedAt?: string;
}

export interface AdminOrganizationVerification {
  id: string;
  name: string;
  legalName?: string;
  orgType: string;
  status: string;
  documents: AdminVerificationDocument[];
  trustScore: number;
  verifiedAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
}

export class AdminApiService {
  private readonly baseUrl = "/api/admin";

  // Dashboard Metrics
  async getMetrics(token: string): Promise<AdminApiResponse<AdminMetrics>> {
    return apiClient.get<AdminApiResponse<AdminMetrics>>(
      `${this.baseUrl}/metrics`,
      token
    );
  }

  // User Management
  async getUsers(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminUser>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminUser>>>(
      `${this.baseUrl}/users${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getUser(
    userId: string,
    token?: string
  ): Promise<AdminApiResponse<AdminUser>> {
    return apiClient.get<AdminApiResponse<AdminUser>>(
      `${this.baseUrl}/users/${userId}`,
      token
    );
  }

  async updateUser(
    token: string,
    userId: string,
    data: Partial<AdminUser>
  ): Promise<AdminApiResponse<AdminUser>> {
    return apiClient.patch<AdminApiResponse<AdminUser>>(
      `${this.baseUrl}/users/${userId}`,
      data,
      token
    );
  }

  async suspendUser(
    token: string,
    userId: string
  ): Promise<AdminApiResponse<null>> {
    return apiClient.post<AdminApiResponse<null>>(
      `${this.baseUrl}/users/${userId}/suspend`,
      {},
      token
    );
  }

  async activateUser(
    token: string,
    userId: string
  ): Promise<AdminApiResponse<null>> {
    return apiClient.post<AdminApiResponse<null>>(
      `${this.baseUrl}/users/${userId}/activate`,
      {},
      token
    );
  }

  async deleteUser(
    token: string,
    userId: string
  ): Promise<AdminApiResponse<null>> {
    return apiClient.delete<AdminApiResponse<null>>(
      `${this.baseUrl}/users/${userId}`,
      token
    );
  }

  // Role Management (platform-level)
  async grantUserRole(
    userId: string,
    role: "attendee" | "organizer" | "moderator" | "admin",
    token?: string
  ): Promise<AdminApiResponse<null>> {
    return apiClient.post<AdminApiResponse<null>>(
      `${this.baseUrl}/users/${userId}/grant-role`,
      { role },
      token
    );
  }

  async revokeUserRole(
    userId: string,
    fallback?: "attendee" | "organizer" | "moderator" | "admin",
    token?: string
  ): Promise<AdminApiResponse<null>> {
    return apiClient.post<AdminApiResponse<null>>(
      `${this.baseUrl}/users/${userId}/revoke-role`,
      { fallback },
      token
    );
  }

  // Organization Management
  async getOrganizations(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminOrganization>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<
      AdminApiResponse<PaginatedResponse<AdminOrganization>>
    >(`${this.baseUrl}/organizations${queryString ? `?${queryString}` : ''}`, token);
  }

  async getOrganization(
    token: string,
    orgId: string
  ): Promise<AdminApiResponse<AdminOrganization>> {
    return apiClient.get<AdminApiResponse<AdminOrganization>>(
      `${this.baseUrl}/organizations/${orgId}`,
      token
    );
  }

  async updateOrganization(
    token: string,
    orgId: string,
    data: Partial<AdminOrganization>
  ): Promise<AdminApiResponse<AdminOrganization>> {
    return apiClient.patch<AdminApiResponse<AdminOrganization>>(
      `${this.baseUrl}/organizations/${orgId}`,
      data,
      token
    );
  }

  // Event Management
  async getEvents(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      categoryId?: string;
      organizerId?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminEvent>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminEvent>>>(
      `${this.baseUrl}/events${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getEvent(
    token: string,
    eventId: string
  ): Promise<AdminApiResponse<AdminEvent>> {
    // Defensive validation to prevent accidental requests with undefined IDs
    if (!eventId) {
      throw new ApiError("Invalid eventId provided to getEvent", 400, null);
    }
    return apiClient.get<AdminApiResponse<AdminEvent>>(
      `${this.baseUrl}/events/${eventId}`,
      token
    );
  }

  async updateEvent(
    token: string,
    eventId: string,
    data: Partial<{
      title: string;
      description: string;
      status: AdminEvent["status"];
      visibility: AdminEvent["visibility"];
      startAt: string;
      endAt: string;
      categoryId: string;
      venueId?: string | null;
    }>
  ): Promise<AdminApiResponse<AdminEvent>> {
    if (!eventId) {
      throw new ApiError("Invalid eventId provided to updateEvent", 400, null);
    }
    return apiClient.patch<AdminApiResponse<AdminEvent>>(
      `${this.baseUrl}/events/${eventId}`,
      data,
      token
    );
  }

  async updateEventStatus(
    token: string,
    eventId: string,
    status: string
  ): Promise<AdminApiResponse<null>> {
    return apiClient.patch<AdminApiResponse<null>>(
      `${this.baseUrl}/events/${eventId}/status`,
      { status },
      token
    );
  }

  // Payment Management
  async getPayments(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      provider?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminPayment>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminPayment>>>(
      `${this.baseUrl}/payments${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  // Payout Management
  async getPayouts(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      orgId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminPayout>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminPayout>>>(
      `${this.baseUrl}/payouts${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async approvePayout(
    token: string,
    payoutId: string
  ): Promise<AdminApiResponse<null>> {
    return apiClient.post<AdminApiResponse<null>>(
      `${this.baseUrl}/payouts/${payoutId}/approve`,
      {},
      token
    );
  }

  // Audit Logs
  async getAuditLogs(
    token: string,
    options: {
      page?: number;
      limit?: number;
      action?: string;
      targetKind?: string;
      actorId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminActivityLog>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminActivityLog>>>(
      `${this.baseUrl}/audit-logs${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  // Refund Management
  async getRefunds(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      orderId?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminRefund>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminRefund>>>(
      `${this.baseUrl}/refunds${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getRefund(
    token: string,
    refundId: string
  ): Promise<AdminApiResponse<AdminRefund>> {
    return apiClient.get<AdminApiResponse<AdminRefund>>(
      `${this.baseUrl}/refunds/${refundId}`,
      token
    );
  }

  async createRefund(
    token: string,
    data: {
      orderId: string;
      amountCents: number;
      currency: string;
      reason?: string;
    }
  ): Promise<AdminApiResponse<AdminRefund>> {
    return apiClient.post<AdminApiResponse<AdminRefund>>(
      `${this.baseUrl}/refunds`,
      data,
      token
    );
  }

  async updateRefundStatus(
    token: string,
    refundId: string,
    status: string,
    reason?: string
  ): Promise<AdminApiResponse<AdminRefund>> {
    return apiClient.patch<AdminApiResponse<AdminRefund>>(
      `${this.baseUrl}/refunds/${refundId}/status`,
      { status, reason },
      token
    );
  }

  async approveRefund(
    token: string,
    refundId: string,
    note?: string
  ): Promise<AdminApiResponse<null>> {
    return apiClient.post<AdminApiResponse<null>>(
      `${this.baseUrl}/refunds/${refundId}/approve`,
      { note },
      token
    );
  }

  async rejectRefund(
    token: string,
    refundId: string,
    reason: string
  ): Promise<AdminApiResponse<null>> {
    return apiClient.post<AdminApiResponse<null>>(
      `${this.baseUrl}/refunds/${refundId}/reject`,
      { reason },
      token
    );
  }

  async processRefund(
    token: string,
    refundId: string,
    force = false
  ): Promise<AdminApiResponse<null>> {
    return apiClient.post<AdminApiResponse<null>>(
      `${this.baseUrl}/refunds/${refundId}/process`,
      { force },
      token
    );
  }

  // System Settings
  async getSiteSettings(
    token: string
  ): Promise<AdminApiResponse<Record<string, unknown>>> {
    return apiClient.get<AdminApiResponse<Record<string, unknown>>>(
      `${this.baseUrl}/settings`,
      token
    );
  }

  async updateSiteSettings(
    token: string,
    settings: Record<string, unknown>
  ): Promise<AdminApiResponse<Record<string, unknown>>> {
    return apiClient.patch<AdminApiResponse<Record<string, unknown>>>(
      `${this.baseUrl}/settings`,
      settings,
      token
    );
  }

  // Category Management
  async getCategories(
    token: string,
    search?: string
  ): Promise<AdminApiResponse<unknown[]>> {
    const url = search
      ? `${this.baseUrl}/categories?search=${encodeURIComponent(search)}`
      : `${this.baseUrl}/categories`;
    return apiClient.get<AdminApiResponse<unknown[]>>(url, token);
  }

  async getCategoryById(
    token: string,
    id: string
  ): Promise<AdminApiResponse<unknown>> {
    return apiClient.get<AdminApiResponse<unknown>>(
      `${this.baseUrl}/categories/${id}`,
      token
    );
  }

  async createCategory(
    token: string,
    data: { name: string; slug: string; parentId?: string }
  ): Promise<AdminApiResponse<unknown>> {
    return apiClient.post<AdminApiResponse<unknown>>(
      `${this.baseUrl}/categories`,
      data,
      token
    );
  }

  async updateCategory(
    token: string,
    id: string,
    data: { name?: string; slug?: string; parentId?: string }
  ): Promise<AdminApiResponse<unknown>> {
    return apiClient.patch<AdminApiResponse<unknown>>(
      `${this.baseUrl}/categories/${id}`,
      data,
      token
    );
  }

  async deleteCategory(
    token: string,
    id: string
  ): Promise<AdminApiResponse<unknown>> {
    return apiClient.delete<AdminApiResponse<unknown>>(
      `${this.baseUrl}/categories/${id}`,
      token
    );
  }

  // Venue Catalog
  async listVenueCatalog(
    token: string,
    params?: { search?: string; page?: number; limit?: number }
  ): Promise<AdminListResponse<AdminVenueCatalogEntry>> {
    const query = params ? buildQueryString(params) : '';
    const url = `${this.baseUrl}/venues/catalog${query ? `?${query}` : ''}`;
    return apiClient.get<AdminListResponse<AdminVenueCatalogEntry>>(url, token);
  }

  async createVenueCatalog(
    token: string,
    data: Partial<AdminVenueCatalogEntry> & {
      address: AdminVenueCatalogEntry['address'];
      timezone: string;
    }
  ): Promise<AdminApiResponse<AdminVenueCatalogEntry>> {
    return apiClient.post<AdminApiResponse<AdminVenueCatalogEntry>>(
      `${this.baseUrl}/venues/catalog`,
      data,
      token
    );
  }

  async updateVenueCatalog(
    token: string,
    id: string,
    data: Partial<AdminVenueCatalogEntry>
  ): Promise<AdminApiResponse<AdminVenueCatalogEntry>> {
    return apiClient.patch<AdminApiResponse<AdminVenueCatalogEntry>>(
      `${this.baseUrl}/venues/catalog/${id}`,
      data,
      token
    );
  }

  async deleteVenueCatalog(
    token: string,
    id: string
  ): Promise<AdminApiResponse<{ deleted: boolean }>> {
    return apiClient.delete<AdminApiResponse<{ deleted: boolean }>>(
      `${this.baseUrl}/venues/catalog/${id}`,
      token
    );
  }

  async bulkUploadVenueCatalog(
    token: string,
    formData: FormData
  ): Promise<AdminApiResponse<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ index: number; message: string }>;
  }>> {
    const uploadUrl = new URL(`${this.baseUrl}/venues/catalog/bulk-upload`, API_BASE_URL);
    const response = await fetch(uploadUrl.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload file');
    }

    return response.json();
  }

  // Venues
  async getVenues(
    token: string,
    params?: { search?: string; status?: 'active' | 'archived' | 'all'; page?: number; limit?: number }
  ): Promise<AdminListResponse<AdminVenueRecord>> {
    const query = params ? buildQueryString(params) : '';
    const url = `${this.baseUrl}/venues${query ? `?${query}` : ''}`;
    return apiClient.get<AdminListResponse<AdminVenueRecord>>(url, token);
  }

  async getVenue(
    token: string,
    id: string
  ): Promise<AdminApiResponse<AdminVenueRecord>> {
    return apiClient.get<AdminApiResponse<AdminVenueRecord>>(
      `${this.baseUrl}/venues/${id}`,
      token
    );
  }

  async archiveVenue(
    token: string,
    id: string
  ): Promise<AdminApiResponse<{ archived: boolean }>> {
    return apiClient.delete<AdminApiResponse<{ archived: boolean }>>(
      `${this.baseUrl}/venues/${id}`,
      token
    );
  }

  async restoreVenue(
    token: string,
    id: string
  ): Promise<AdminApiResponse<{ restored: boolean }>> {
    return apiClient.post<AdminApiResponse<{ restored: boolean }>>(
      `${this.baseUrl}/venues/${id}/restore`,
      undefined,
      token
    );
  }

  // Dispute Management
  async getDisputes(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      provider?: string;
      orderId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminDispute>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminDispute>>>(
      `${this.baseUrl}/disputes${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getDisputeStats(token: string): Promise<AdminApiResponse<AdminDisputeStats>> {
    return apiClient.get<AdminApiResponse<AdminDisputeStats>>(
      `${this.baseUrl}/disputes/stats`,
      token
    );
  }

  async getDispute(id: string, token: string): Promise<AdminApiResponse<AdminDispute>> {
    return apiClient.get<AdminApiResponse<AdminDispute>>(
      `${this.baseUrl}/disputes/${id}`,
      token
    );
  }

  async updateDisputeStatus(
    id: string,
    data: { status: string; note?: string },
    token: string
  ): Promise<AdminApiResponse<AdminDispute>> {
    return apiClient.patch<AdminApiResponse<AdminDispute>>(
      `${this.baseUrl}/disputes/${id}/status`,
      data,
      token
    );
  }

  async respondToDispute(
    id: string,
    data: { response: string; evidenceUrls?: string },
    token: string
  ): Promise<AdminApiResponse<{ message: string; response: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string; response: string }>>(
      `${this.baseUrl}/disputes/${id}/respond`,
      data,
      token
    );
  }

  async closeDispute(
    id: string,
    data: { status: string; note?: string; closedAt?: string },
    token: string
  ): Promise<AdminApiResponse<AdminDispute>> {
    return apiClient.post<AdminApiResponse<AdminDispute>>(
      `${this.baseUrl}/disputes/${id}/close`,
      data,
      token
    );
  }

  // Fee Schedule Management
  async getFeeSchedules(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      kind?: 'platform' | 'processing';
      active?: boolean;
      currency?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminFeeSchedule>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminFeeSchedule>>>(
      `${this.baseUrl}/fee-schedules${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getFeeScheduleStats(token: string): Promise<AdminApiResponse<AdminFeeScheduleStats>> {
    return apiClient.get<AdminApiResponse<AdminFeeScheduleStats>>(
      `${this.baseUrl}/fee-schedules/stats`,
      token
    );
  }

  async getFeeSchedule(id: string, token: string): Promise<AdminApiResponse<AdminFeeSchedule>> {
    return apiClient.get<AdminApiResponse<AdminFeeSchedule>>(
      `${this.baseUrl}/fee-schedules/${id}`,
      token
    );
  }

  async createFeeSchedule(
    data: {
      kind: 'platform' | 'processing';
      name: string;
      percent: number;
      fixedCents: number;
      currency?: string;
      active?: boolean;
    },
    token: string
  ): Promise<AdminApiResponse<AdminFeeSchedule>> {
    return apiClient.post<AdminApiResponse<AdminFeeSchedule>>(
      `${this.baseUrl}/fee-schedules`,
      data,
      token
    );
  }

  async updateFeeSchedule(
    id: string,
    data: {
      name?: string;
      percent?: number;
      fixedCents?: number;
      currency?: string;
      active?: boolean;
    },
    token: string
  ): Promise<AdminApiResponse<AdminFeeSchedule>> {
    return apiClient.patch<AdminApiResponse<AdminFeeSchedule>>(
      `${this.baseUrl}/fee-schedules/${id}`,
      data,
      token
    );
  }

  async deleteFeeSchedule(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.delete<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/fee-schedules/${id}`,
      token
    );
  }

  async deactivateFeeSchedule(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/fee-schedules/${id}/deactivate`,
      undefined,
      token
    );
  }

  async createOrgFeeOverride(
    data: {
      orgId: string;
      feeScheduleId: string;
      startsAt?: string;
      endsAt?: string;
    },
    token: string
  ): Promise<AdminApiResponse<AdminOrgFeeOverride>> {
    return apiClient.post<AdminApiResponse<AdminOrgFeeOverride>>(
      `${this.baseUrl}/fee-schedules/overrides`,
      data,
      token
    );
  }

  async getOrgFeeOverrides(orgId: string, token: string): Promise<AdminApiResponse<AdminOrgFeeOverride[]>> {
    return apiClient.get<AdminApiResponse<AdminOrgFeeOverride[]>>(
      `${this.baseUrl}/fee-schedules/overrides/organization/${orgId}`,
      token
    );
  }

  async updateOrgFeeOverride(
    id: string,
    data: {
      feeScheduleId?: string;
      startsAt?: string;
      endsAt?: string;
    },
    token: string
  ): Promise<AdminApiResponse<AdminOrgFeeOverride>> {
    return apiClient.patch<AdminApiResponse<AdminOrgFeeOverride>>(
      `${this.baseUrl}/fee-schedules/overrides/${id}`,
      data,
      token
    );
  }

  async deleteOrgFeeOverride(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.delete<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/fee-schedules/overrides/${id}`,
      token
    );
  }

  // Tax Rate Management
  async getTaxRates(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      country?: string;
      region?: string;
      city?: string;
      active?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminTaxRate>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminTaxRate>>>(
      `${this.baseUrl}/tax-rates${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getTaxRateStats(token: string): Promise<AdminApiResponse<AdminTaxRateStats>> {
    return apiClient.get<AdminApiResponse<AdminTaxRateStats>>(
      `${this.baseUrl}/tax-rates/stats`,
      token
    );
  }

  async getTaxRatesByCountry(country: string, token: string): Promise<AdminApiResponse<AdminTaxRate[]>> {
    return apiClient.get<AdminApiResponse<AdminTaxRate[]>>(
      `${this.baseUrl}/tax-rates/country/${country}`,
      token
    );
  }

  async getTaxRate(id: string, token: string): Promise<AdminApiResponse<AdminTaxRate>> {
    return apiClient.get<AdminApiResponse<AdminTaxRate>>(
      `${this.baseUrl}/tax-rates/${id}`,
      token
    );
  }

  async createTaxRate(
    data: {
      country: string;
      region?: string;
      city?: string;
      postal?: string;
      rate: number;
      name: string;
      active?: boolean;
    },
    token: string
  ): Promise<AdminApiResponse<AdminTaxRate>> {
    return apiClient.post<AdminApiResponse<AdminTaxRate>>(
      `${this.baseUrl}/tax-rates`,
      data,
      token
    );
  }

  async updateTaxRate(
    id: string,
    data: {
      country?: string;
      region?: string;
      city?: string;
      postal?: string;
      rate?: number;
      name?: string;
      active?: boolean;
    },
    token: string
  ): Promise<AdminApiResponse<AdminTaxRate>> {
    return apiClient.patch<AdminApiResponse<AdminTaxRate>>(
      `${this.baseUrl}/tax-rates/${id}`,
      data,
      token
    );
  }

  async deleteTaxRate(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.delete<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/tax-rates/${id}`,
      token
    );
  }

  async deactivateTaxRate(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/tax-rates/${id}/deactivate`,
      undefined,
      token
    );
  }

  // Orders Management
  async getOrders(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      eventId?: string;
      buyerId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminOrder>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminOrder>>>(
      `${this.baseUrl}/orders${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getOrderStats(token: string): Promise<AdminApiResponse<AdminOrderStats>> {
    return apiClient.get<AdminApiResponse<AdminOrderStats>>(
      `${this.baseUrl}/orders/stats`,
      token
    );
  }

  async getOrder(id: string, token: string): Promise<AdminApiResponse<AdminOrder>> {
    return apiClient.get<AdminApiResponse<AdminOrder>>(
      `${this.baseUrl}/orders/${id}`,
      token
    );
  }

  async updateOrderStatus(
    id: string,
    data: { status: string; note?: string },
    token: string
  ): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.patch<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/orders/${id}/status`,
      data,
      token
    );
  }

  async cancelOrder(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/orders/${id}/cancel`,
      undefined,
      token
    );
  }

  // Tickets Management
  async getTickets(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      eventId?: string;
      buyerId?: string;
      ticketTypeId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminTicket>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminTicket>>>(
      `${this.baseUrl}/tickets${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getTicketStats(token: string): Promise<AdminApiResponse<AdminTicketStats>> {
    return apiClient.get<AdminApiResponse<AdminTicketStats>>(
      `${this.baseUrl}/tickets/stats`,
      token
    );
  }

  async getTicket(id: string, token: string): Promise<AdminApiResponse<AdminTicket>> {
    return apiClient.get<AdminApiResponse<AdminTicket>>(
      `${this.baseUrl}/tickets/${id}`,
      token
    );
  }

  async voidTicket(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/tickets/${id}/void`,
      undefined,
      token
    );
  }

  async getTicketTransfers(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      ticketId?: string;
      fromUserId?: string;
      toUserId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminTicketTransfer>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminTicketTransfer>>>(
      `${this.baseUrl}/tickets/transfers${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getTicketCheckins(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      eventId?: string;
      ticketId?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminTicketCheckin>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminTicketCheckin>>>(
      `${this.baseUrl}/tickets/checkins${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  // Notifications Management
  async getNotifications(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      channel?: string;
      userId?: string;
      read?: boolean;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminNotification>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminNotification>>>(
      `${this.baseUrl}/notifications${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getNotificationStats(token: string): Promise<AdminApiResponse<AdminNotificationStats>> {
    return apiClient.get<AdminApiResponse<AdminNotificationStats>>(
      `${this.baseUrl}/notifications/stats`,
      token
    );
  }

  async broadcastNotification(
    data: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      channels: ('in_app' | 'email' | 'push' | 'sms')[];
      targetUserIds?: string[];
      targetRoles?: string[];
    },
    token: string
  ): Promise<AdminApiResponse<{ message: string; sent: number }>> {
    return apiClient.post<AdminApiResponse<{ message: string; sent: number }>>(
      `${this.baseUrl}/notifications/broadcast`,
      data,
      token
    );
  }

  async deleteNotification(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.delete<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/notifications/${id}`,
      token
    );
  }

  // Reviews Management
  async getEventReviews(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      eventId?: string;
      userId?: string;
      minRating?: number;
      maxRating?: number;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminEventReview>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminEventReview>>>(
      `${this.baseUrl}/reviews/events${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getOrganizerReviews(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      orgId?: string;
      userId?: string;
      minRating?: number;
      maxRating?: number;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminOrganizerReview>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminOrganizerReview>>>(
      `${this.baseUrl}/reviews/organizers${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getReviewStats(token: string): Promise<AdminApiResponse<AdminReviewStats>> {
    return apiClient.get<AdminApiResponse<AdminReviewStats>>(
      `${this.baseUrl}/reviews/stats`,
      token
    );
  }

  async deleteEventReview(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.delete<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/reviews/events/${id}`,
      token
    );
  }

  async deleteOrganizerReview(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.delete<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/reviews/organizers/${id}`,
      token
    );
  }

  // Promotions Management
  async getPromotions(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      eventId?: string;
      orgId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminPromotion>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminPromotion>>>(
      `${this.baseUrl}/promotions${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getPromotionStats(token: string): Promise<AdminApiResponse<AdminPromotionStats>> {
    return apiClient.get<AdminApiResponse<AdminPromotionStats>>(
      `${this.baseUrl}/promotions/stats`,
      token
    );
  }

  async getPromotion(id: string, token: string): Promise<AdminApiResponse<AdminPromotion>> {
    return apiClient.get<AdminApiResponse<AdminPromotion>>(
      `${this.baseUrl}/promotions/${id}`,
      token
    );
  }

  async deactivatePromotion(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/promotions/${id}/deactivate`,
      undefined,
      token
    );
  }

  async getPromoCodes(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      active?: boolean;
      promotionId?: string;
      eventId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminPromoCode>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminPromoCode>>>(
      `${this.baseUrl}/promo-codes${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  // Moderation/Flags Management
  async getFlags(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      targetKind?: string;
      reporterId?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminFlag>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminFlag>>>(
      `${this.baseUrl}/flags${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getModerationStats(token: string): Promise<AdminApiResponse<AdminModerationStats>> {
    return apiClient.get<AdminApiResponse<AdminModerationStats>>(
      `${this.baseUrl}/flags/stats`,
      token
    );
  }

  async getFlag(id: string, token: string): Promise<AdminApiResponse<AdminFlag>> {
    return apiClient.get<AdminApiResponse<AdminFlag>>(
      `${this.baseUrl}/flags/${id}`,
      token
    );
  }

  async resolveFlag(
    id: string,
    data: {
      action: 'approve' | 'reject' | 'resolve';
      note?: string;
    },
    token: string
  ): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/flags/${id}/resolve`,
      data,
      token
    );
  }

  async getModerationActions(
    token: string,
    options: {
      page?: number;
      limit?: number;
      flagId?: string;
      actorId?: string;
      action?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminModerationAction>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminModerationAction>>>(
      `${this.baseUrl}/moderation/actions${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  // Sessions Management
  async getSessions(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      userId?: string;
      active?: boolean;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminSession>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminSession>>>(
      `${this.baseUrl}/sessions${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getSessionStats(token: string): Promise<AdminApiResponse<AdminSessionStats>> {
    return apiClient.get<AdminApiResponse<AdminSessionStats>>(
      `${this.baseUrl}/sessions/stats`,
      token
    );
  }

  async revokeSession(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.delete<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/sessions/${id}`,
      token
    );
  }

  async revokeAllUserSessions(userId: string, token: string): Promise<AdminApiResponse<{ message: string; count: number }>> {
    return apiClient.post<AdminApiResponse<{ message: string; count: number }>>(
      `${this.baseUrl}/sessions/users/${userId}/revoke-all`,
      undefined,
      token
    );
  }

  // Revenue Analytics
  async getRevenueMetrics(
    token: string,
    options: {
      periodStart?: string;
      periodEnd?: string;
      groupBy?: 'day' | 'week' | 'month';
    } = {}
  ): Promise<AdminApiResponse<AdminRevenueMetrics>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<AdminRevenueMetrics>>(
      `${this.baseUrl}/revenue/metrics${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getRevenueBreakdown(
    token: string,
    options: {
      periodStart?: string;
      periodEnd?: string;
      limit?: number;
    } = {}
  ): Promise<AdminApiResponse<AdminRevenueBreakdown>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<AdminRevenueBreakdown>>(
      `${this.baseUrl}/revenue/breakdown${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  // Webhooks Management
  async getWebhooks(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      active?: boolean;
      orgId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminWebhook>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminWebhook>>>(
      `${this.baseUrl}/webhooks${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async getWebhookStats(token: string): Promise<AdminApiResponse<AdminWebhookStats>> {
    return apiClient.get<AdminApiResponse<AdminWebhookStats>>(
      `${this.baseUrl}/webhooks/stats`,
      token
    );
  }

  async getWebhook(id: string, token: string): Promise<AdminApiResponse<AdminWebhook>> {
    return apiClient.get<AdminApiResponse<AdminWebhook>>(
      `${this.baseUrl}/webhooks/${id}`,
      token
    );
  }

  async getWebhookEvents(
    token: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      webhookId?: string;
      eventType?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminWebhookEvent>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminWebhookEvent>>>(
      `${this.baseUrl}/webhook-events${queryString ? `?${queryString}` : ''}`,
      token
    );
  }

  async retryWebhookEvent(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/webhook-events/${id}/retry`,
      undefined,
      token
    );
  }

  async testWebhook(id: string, token: string): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/webhooks/${id}/test`,
      undefined,
      token
    );
  }

  // Organization Verification Details
  async getOrganizationVerification(orgId: string, token: string): Promise<AdminApiResponse<AdminOrganizationVerification>> {
    return apiClient.get<AdminApiResponse<AdminOrganizationVerification>>(
      `${this.baseUrl}/organizations/${orgId}/verification`,
      token
    );
  }

  async approveOrganization(
    orgId: string,
    data: { note?: string; trustScore?: number },
    token: string
  ): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/organizations/${orgId}/verification/approve`,
      data,
      token
    );
  }

  async rejectOrganization(
    orgId: string,
    data: { reason: string; note?: string },
    token: string
  ): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/organizations/${orgId}/verification/reject`,
      data,
      token
    );
  }

  async suspendOrganization(
    orgId: string,
    data: { reason: string; note?: string },
    token: string
  ): Promise<AdminApiResponse<{ message: string }>> {
    return apiClient.post<AdminApiResponse<{ message: string }>>(
      `${this.baseUrl}/organizations/${orgId}/verification/suspend`,
      data,
      token
    );
  }

  async reviewDocument(
    docId: string,
    data: { status: 'approved' | 'rejected'; note?: string },
    token: string
  ): Promise<AdminApiResponse<AdminVerificationDocument>> {
    return apiClient.post<AdminApiResponse<AdminVerificationDocument>>(
      `${this.baseUrl}/verification/documents/${docId}/review`,
      data,
      token
    );
  }

  async getVerificationQueue(
    token: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      orgType?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<AdminApiResponse<PaginatedResponse<AdminOrganizationVerification>>> {
    const queryString = buildQueryString(options);
    return apiClient.get<AdminApiResponse<PaginatedResponse<AdminOrganizationVerification>>>(
      `${this.baseUrl}/organizations/verification${queryString ? `?${queryString}` : ''}`,
      token
    );
  }
}

export const adminApiService = new AdminApiService();
