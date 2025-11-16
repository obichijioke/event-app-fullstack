"use client";

import { apiClient, ApiError } from "@/lib/api-client";
import { buildQueryString } from "@/lib/utils/query-builder";

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
}

export const adminApiService = new AdminApiService();
