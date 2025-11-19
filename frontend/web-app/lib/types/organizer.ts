// Organizer Dashboard Types

// Common Types
export type OrganizerRole = 'owner' | 'manager' | 'finance' | 'staff';
export type OrganizationType = 'business' | 'personal' | 'nonprofit' | 'government';
export type OrganizationStatus = 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'banned';
export type EventStatus = 'draft' | 'pending' | 'approved' | 'live' | 'paused' | 'canceled' | 'completed';
export type OrderStatus = 'pending' | 'paid' | 'refunded' | 'canceled' | 'chargeback';
export type TicketStatus = 'issued' | 'transferred' | 'refunded' | 'checked_in' | 'canceled';
export type PayoutStatus = 'pending' | 'in_review' | 'approved' | 'failed' | 'completed';
export type FlagStatus = 'open' | 'resolved' | 'dismissed';
export type TicketKind = 'GA' | 'SEATED' | 'VIP' | 'EARLY_BIRD';

// Dashboard Overview Types
export interface DashboardMetrics {
  upcomingEvents: number;
  grossRevenueCents: number;
  netRevenueCents: number;
  subtotalCents: number;
  feesCents: number;
  ordersCount: number;
  ticketsSold: number;
  currency?: string;
  unsettledPayouts: {
    count: number;
    amountCents: number;
  };
  totalVenues: number;
}

export interface DashboardOrganization {
  id: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  role: OrganizerRole;
}

export interface DashboardEvent {
  id: string;
  title: string;
  status: EventStatus;
  startAt: string;
  publishAt?: string;
  descriptionMd?: string;
  visibility?: 'public' | 'unlisted' | 'private';
  endAt?: string;
  doorTime?: string;
  categoryId?: string;
  venueId?: string;
  seatmapId?: string;
  coverImageUrl?: string;
}

export interface DashboardOrder {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: string;
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
  };
}

export interface DashboardTasks {
  drafts: DashboardEvent[];
  moderationAlerts: number;
  unsettledPayouts: {
    count: number;
    amountCents: number;
  };
}

export interface DashboardVenue {
  id: string;
  name: string;
  address: Address;
  capacity?: number;
  _count: {
    seatmaps: number;
    events: number;
  };
}

export interface DashboardOverviewResponse {
  organization: DashboardOrganization;
  metrics: DashboardMetrics;
  upcomingEvents: DashboardEvent[];
  recentOrders: DashboardOrder[];
  recentVenues: DashboardVenue[];
  tasks: DashboardTasks;
}

// Events Management Types
export interface EventListParams {
  orgId: string;
  status?: EventStatus;
  categoryId?: string;
  upcoming?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateEventDto {
  orgId: string;
  title: string;
  descriptionMd?: string;
  status?: EventStatus;
  visibility?: 'public' | 'unlisted' | 'private';
  categoryId?: string;
  startAt: string;
  endAt?: string;
  doorTime?: string;
  venueId?: string;
  seatmapId?: string;
  coverImageUrl?: string;
}

export interface UpdateEventDto {
  title?: string;
  descriptionMd?: string;
  status?: EventStatus;
  visibility?: 'public' | 'unlisted' | 'private';
  categoryId?: string;
  startAt?: string;
  endAt?: string;
  doorTime?: string;
  venueId?: string;
  seatmapId?: string;
  coverImageUrl?: string;
  publishAt?: string;
}

export interface EventOccurrence {
  id: string;
  eventId: string;
  startsAt: string;
  endsAt: string;
  gateOpenAt?: string;
}

export interface CreateOccurrenceDto {
  startsAt: string;
  endsAt: string;
  gateOpenAt?: string;
}

export interface EventAsset {
  id: string;
  eventId: string;
  kind: string;
  url: string;
  altText?: string;
}

export interface CreateAssetDto {
  kind: string;
  url: string;
  altText?: string;
}

// Analytics Types
export interface EventAnalytics {
  event: {
    id: string;
    title: string;
    status: EventStatus;
    startAt: string;
  };
  tickets: {
    issued: number;
    checked_in: number;
    refunded: number;
  };
  reviews: {
    averageRating: number;
    total: number;
    recent: Review[];
  };
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface OrganizationInsights {
  followers: number;
  reviews: {
    averageRating: number;
    total: number;
    recent: Review[];
  };
}

// Orders & Attendees Types
export interface OrderListParams {
  orgId: string;
  status?: OrderStatus;
  eventId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderItem {
  ticketType: {
    id: string;
    name: string;
    kind: TicketKind;
  };
  quantity: number;
  unitPriceCents: number;
}

export interface Ticket {
  id: string;
  status: TicketStatus;
  ownerId: string;
}

export interface Payment {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
}

export interface Refund {
  id: string;
  amountCents: number;
  reason?: string;
  createdAt: string;
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: string;
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  tickets: Ticket[];
  payments: Payment[];
  refunds: Refund[];
}

export interface OrderListResponse {
  data: OrderDetail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RefundDto {
  amountCents: number;
  reason?: string;
}

export interface TransferTicketDto {
  toUserId: string;
}

export interface CheckinDto {
  ticketId: string;
  gate?: string;
}

export interface CheckinStats {
  totalTickets: number;
  checkedIn: number;
  pending: number;
  checkInRate: number;
}

export interface RecentCheckin {
  id: string;
  ticketId: string;
  attendeeName: string;
  ticketType: string;
  scannedAt: string;
}

// Notifications & Moderation Types
export interface ModerationFlag {
  id: string;
  targetKind: string;
  targetId: string;
  reason: string;
  status: FlagStatus;
  createdAt: string;
  event?: {
    id: string;
    title: string;
  };
}

export interface Payout {
  id: string;
  status: PayoutStatus;
  amountCents: number;
  currency: string;
  createdAt: string;
  scheduledFor?: string;
}

export interface NotificationsResponse {
  role: OrganizerRole;
  moderationFlags: ModerationFlag[];
  payouts: Payout[];
}

// Financials Types - REMOVED DUPLICATE, see line 637 for correct definition

// REMOVED DUPLICATE TYPES - see lines 637+ for correct definitions:
// - FinancialSummaryParams
// - FinancialSummary
// - CreatePayoutDto
// - CreatePayoutAccountDto
// - Payout
// - PayoutAccount

// Tickets & Inventory Types
export interface TicketType {
  id: string;
  name: string;
  kind: TicketKind;
  currency: string;
  priceCents: number;
  feeCents: number;
  capacity: number;
  sold?: number;
  salesStart?: string;
  salesEnd?: string;
  status: string;
}

export interface CreateTicketTypeDto {
  name: string;
  kind: TicketKind;
  currency: string;
  priceCents: number;
  feeCents?: number;
  capacity: number;
  salesStart?: string;
  salesEnd?: string;
  status?: string;
}

export interface UpdateTicketTypeDto {
  name?: string;
  priceCents?: number;
  feeCents?: number;
  capacity?: number;
  salesStart?: string;
  salesEnd?: string;
  status?: string;
}

export interface TicketPriceTier {
  id: string;
  ticketTypeId: string;
  name: string;
  priceCents: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateTicketPriceTierDto {
  name: string;
  priceCents: number;
  startDate?: string;
  endDate?: string;
}

export interface BulkSeatAssignmentDto {
  seatIds: string[];
}

export interface InventoryTicketType {
  id: string;
  name: string;
  kind: TicketKind;
  capacity: number;
  sold: number;
  checkedIn: number;
  holds: number;
  available: number;
  grossRevenueCents: number;
  feeRevenueCents: number;
  currency: string;
}

export interface InventorySnapshot {
  event: {
    id: string;
    title: string;
    status: EventStatus;
    startAt: string;
  };
  totals: {
    sold: number;
    checkedIn: number;
    holds: number;
    grossRevenueCents: number;
    feeRevenueCents: number;
  };
  ticketTypes: InventoryTicketType[];
}

export interface CreateHoldDto {
  ticketTypeId: string;
  quantity: number;
  expiresAt?: string;
  reason?: string;
}

export interface Hold {
  id: string;
  ticketTypeId: string;
  quantity: number;
  expiresAt: string;
  reason?: string;
  createdAt: string;
}

// Promotions Types
export interface Promotion {
  id: string;
  name: string;
  type: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  eventIds: string[];
  startsAt?: string;
  endsAt?: string;
  maxUses?: number;
  currentUses?: number;
}

export interface CreatePromotionDto {
  name: string;
  type: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  eventIds: string[];
  startsAt?: string;
  endsAt?: string;
  maxUses?: number;
}

export interface PromoCode {
  id: string;
  code: string;
  promotionId: string;
  promotion?: Promotion;
  maxUses?: number;
  startsAt?: string;
  endsAt?: string;
  redemptions: number;
}

export interface CreatePromoCodeDto {
  code: string;
  promotionId: string;
  maxUses?: number;
  startsAt?: string;
  endsAt?: string;
}

// Organization Settings Types
export interface Organization {
  id: string;
  ownerId: string;
  name: string;
  type: OrganizationType;
  legalName?: string;
  website?: string;
  country?: string;
  supportEmail?: string;
  taxId?: string;
  status: OrganizationStatus;
  payoutProvider?: string;
  payoutAccountId?: string;
  trustScore?: number;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
  members?: OrganizationMember[];
}

export interface OrganizationMember {
  userId: string;
  role: OrganizerRole;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateOrganizationDto {
  name: string;
  type?: OrganizationType;
  legalName?: string;
  website?: string;
  country?: string;
  supportEmail?: string;
  taxId?: string;
}

export interface CreatePersonalOrganizationDto {
  name: string;
  description?: string;
  country?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  type?: OrganizationType;
  website?: string;
  supportEmail?: string;
  description?: string;
  logoUrl?: string;
}

export interface AddMemberDto {
  email: string;
  role: OrganizerRole;
}

export interface UpdateMemberRoleDto {
  role: OrganizerRole;
}

// Venue Types
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal: string;
  country: string;
}

export interface Venue {
  id: string;
  orgId: string;
  name: string;
  address: Address;
  timezone: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  catalogVenueId?: string;
  visibility?: 'shared_ref' | 'private';
  createdAt: string;
  deletedAt?: string;
  catalogVenue?: VenueCatalogEntry;
  _count?: {
    seatmaps: number;
    events: number;
  };
}

export interface VenueCatalogEntry {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  address: Address;
  timezone: string;
  capacityMin?: number | null;
  capacityMax?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  tags: string[];
  defaultSeatmapSpec?: any;
  createdAt: string;
  updatedAt: string;
}

export interface VenueCatalogSearchResponse {
  data: VenueCatalogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateVenueDto {
  name: string;
  address: Address;
  timezone: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  catalogVenueId?: string;
}

export interface UpdateVenueDto {
  name?: string;
  address?: Address;
  timezone?: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
}

// Seatmap Types
export interface SeatData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'standard' | 'vip' | 'accessible';
  section?: string;
  row?: string;
  number?: string;
}

export interface SeatmapSpec {
  version: string;
  canvasWidth: number;
  canvasHeight: number;
  seats: SeatData[];
}

export interface Seatmap {
  id: string;
  venueId: string;
  name: string;
  description?: string;
  spec: SeatmapSpec;
  isDefault: boolean;
  createdAt: string;
  venue?: {
    id: string;
    name: string;
    orgId: string;
  };
  _count?: {
    seats: number;
    events: number;
  };
}

export interface CreateSeatmapDto {
  name: string;
  description?: string;
  spec: SeatmapSpec;
  isDefault?: boolean;
}

export interface UpdateSeatmapDto {
  name?: string;
  description?: string;
  spec?: SeatmapSpec;
  isDefault?: boolean;
}

// ============================================================================
// Financial & Payout Types
// ============================================================================

export interface FinancialSummaryParams {
  startDate?: string;
  endDate?: string;
}

export interface FinancialSummary {
  totals: {
    grossRevenueCents: number;
    netRevenueCents: number;
    feeCents: number;
    refundCents: number;
    taxCents: number;
    subtotalCents: number;
    ordersCount: number;
    ticketsSold: number;
    payoutsCents: number;
    currency?: string;
  };
  ordersByDay: { [date: string]: number };
  currency?: string;
}

export interface Payout {
  id: string;
  orgId: string;
  amountCents: number;
  currency: string;
  status: PayoutStatus;
  scheduledFor?: string;
  initiatedAt?: string;
  provider?: string;
  providerRef?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePayoutDto {
  amountCents: number;
  currency: string;
  scheduledFor?: string;
  notes?: string;
}

export interface PayoutAccount {
  id: string;
  orgId: string;
  provider: string;
  externalId: string;
  defaultAccount: boolean;
  createdAt: string;
}

export interface CreatePayoutAccountDto {
  provider: string;
  externalId: string;
  defaultAccount?: boolean;
}

export interface CalculatePayoutsParams {
  startDate?: string;
  endDate?: string;
  eventId?: string;
}

export interface CalculatePayoutsResponse {
  period: {
    startDate: string;
    endDate: string;
    eventId?: string;
  };
  summary: {
    totalOrders: number;
    totalRevenue: string;
    platformFees: string;
    organizerRevenue: string;
    currency: string;
  };
  existingPayouts: number;
  canCreatePayout: boolean;
}

export interface PayoutStats {
  pending: number;
  inReview: number;
  approved: number;
  failed: number;
  completed: number;
  totalAmount: number;
}

// ============================================================================
// API Keys Types
// ============================================================================

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface ApiKeyWithSecret extends ApiKey {
  secret: string;
}

export interface CreateApiKeyDto {
  name: string;
  scopes?: string[];
}

// ============================================================================
// Webhooks Types
// ============================================================================

export interface Webhook {
  id: string;
  orgId: string;
  url: string;
  secret: string;
  eventFilters: string[];
  active: boolean;
  description?: string;
  createdAt: string;
  _count?: {
    attempts: number;
  };
}

export interface CreateWebhookDto {
  url: string;
  eventFilters: string[];
  description?: string;
  secret?: string;
  active?: boolean;
}

export interface UpdateWebhookDto {
  url?: string;
  eventFilters?: string[];
  description?: string;
  active?: boolean;
}

export interface WebhookEvent {
  id: string;
  topic: string;
  payload: any;
  createdAt: string;
  attempts?: WebhookAttempt[];
}

export interface WebhookAttempt {
  id: string;
  webhookEventId: string;
  endpointId: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  attemptedAt: string;
  retryCount: number;
}

export interface WebhookStats {
  totalEvents: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingRetries: number;
  successRate: number;
}

// ============================================================================
// Refunds Types
// ============================================================================

export type RefundStatus = 'pending' | 'approved' | 'processed' | 'failed' | 'canceled';

export interface Refund {
  id: string;
  orderId: string;
  amountCents: number;
  currency: string;
  reason?: string;
  status: RefundStatus;
  createdBy?: string;
  createdAt: string;
  processedAt?: string;
  providerRef?: string;
  order?: {
    id: string;
    buyerId: string;
    eventId: string;
    totalCents: number;
    status: OrderStatus;
    buyer: {
      id: string;
      name: string;
      email: string;
    };
    event: {
      id: string;
      title: string;
    };
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RefundListParams {
  page?: number;
  limit?: number;
  status?: RefundStatus;
  eventId?: string;
  startDate?: string;
  endDate?: string;
}

export interface RefundListResponse {
  data: Refund[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Notifications Types
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';
export type NotificationCategory = 'order' | 'event' | 'payout' | 'moderation' | 'ticket' | 'system' | 'marketing';
export type NotificationFrequency = 'instant' | 'daily_digest' | 'weekly_digest' | 'disabled';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: any;
  channels: NotificationChannel[];
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  category?: NotificationCategory;
  search?: string;
}

export interface NotificationListResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreference {
  id?: string;
  userId?: string;
  category: NotificationCategory;
  inApp: NotificationFrequency;
  email: NotificationFrequency;
  push: NotificationFrequency;
  sms: NotificationFrequency;
}

export interface UpdatePreferenceDto {
  inApp?: NotificationFrequency;
  email?: NotificationFrequency;
  push?: NotificationFrequency;
  sms?: NotificationFrequency;
}

export interface BulkUpdatePreferencesDto {
  preferences: Array<{
    category: NotificationCategory;
    inApp?: NotificationFrequency;
    email?: NotificationFrequency;
    push?: NotificationFrequency;
    sms?: NotificationFrequency;
  }>;
}

export interface CategoryStats {
  category: string;
  count: number;
  unreadCount: number;
}

export interface BulkActionDto {
  notificationIds: string[];
}
