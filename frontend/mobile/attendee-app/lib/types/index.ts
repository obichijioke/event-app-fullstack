// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  avatarUrl?: string;
  role: 'attendee' | 'organizer' | 'moderator' | 'admin';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface Session {
  id: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

// Event types
export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  status: EventStatus;
  visibility: EventVisibility;
  startDate: string;
  endDate: string;
  timezone: string;
  venue?: Venue;
  venueId?: string;
  organization: Organization;
  organizationId: string;
  category?: Category;
  categoryId?: string;
  coverImageUrl?: string;
  thumbnailUrl?: string;
  ticketTypes: TicketType[];
  isFree: boolean;
  minPrice?: number;
  maxPrice?: number;
  currency: string;
  attendeeCount?: number;
  capacity?: number;
  isSaved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EventStatus = 'draft' | 'pending' | 'approved' | 'live' | 'paused' | 'ended' | 'canceled';
export type EventVisibility = 'public' | 'unlisted' | 'private';

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  description?: string;
  imageUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  verified: boolean;
  followerCount?: number;
  eventCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  description?: string;
  parentId?: string;
  eventCount?: number;
}

// Ticket types
export interface TicketType {
  id: string;
  name: string;
  description?: string;
  type: 'GA' | 'SEATED';
  price: number;
  currency: string;
  quantity: number;
  quantitySold: number;
  quantityAvailable: number;
  maxPerOrder: number;
  minPerOrder: number;
  saleStartDate?: string;
  saleEndDate?: string;
  isOnSale: boolean;
  eventId: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  status: TicketStatus;
  qrCode: string;
  qrCodeUrl?: string;
  ticketType: TicketType;
  ticketTypeId: string;
  event: Event;
  eventId: string;
  order: Order;
  orderId: string;
  seat?: {
    section: string;
    row: string;
    number: string;
  };
  attendeeName?: string;
  attendeeEmail?: string;
  checkedInAt?: string;
  transferredAt?: string;
  createdAt: string;
}

export type TicketStatus = 'issued' | 'transferred' | 'refunded' | 'checked_in' | 'void';

export interface TicketTransfer {
  id: string;
  ticketId: string;
  fromUserId: string;
  toEmail: string;
  toUserId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'expired';
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  fees: number;
  discount: number;
  currency: string;
  paymentProvider?: 'stripe' | 'paystack';
  paymentIntentId?: string;
  event: Event;
  eventId: string;
  tickets: Ticket[];
  items: OrderItem[];
  promoCode?: string;
  userId: string;
  createdAt: string;
  paidAt?: string;
}

export type OrderStatus = 'pending' | 'paid' | 'canceled' | 'refunded' | 'chargeback';

export interface OrderItem {
  id: string;
  ticketTypeId: string;
  ticketType: TicketType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderRequest {
  eventId: string;
  items: {
    ticketTypeId: string;
    quantity: number;
  }[];
  promoCode?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'push' | 'sms';
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
}

// Saved event type
export interface SavedEvent {
  id: string;
  eventId: string;
  event: Event;
  createdAt: string;
}

// Location types
export interface UserLocation {
  id: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  source: 'ip' | 'browser' | 'manual' | 'address';
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  name: string;
  state?: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  population?: number;
  timezone?: string;
}

// Review types
export interface Review {
  id: string;
  rating: number;
  comment?: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
  eventId?: string;
  orgId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

// Following types
export interface FollowedOrganizer {
  id: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    legalName?: string;
    website?: string;
    country?: string;
    status: string;
    createdAt: string;
  };
  followedAt: string;
}

// Dispute types
export interface Dispute {
  id: string;
  type: DisputeType;
  status: DisputeStatus;
  reason: string;
  description: string;
  orderId: string;
  order: Order;
  messages: DisputeMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export type DisputeType =
  | 'chargeback'
  | 'buyer_complaint'
  | 'fraudulent_transaction'
  | 'service_not_provided'
  | 'product_not_received'
  | 'unauthorized_charge'
  | 'other';

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'awaiting_evidence'
  | 'resolved_won'
  | 'resolved_lost'
  | 'closed';

export interface DisputeMessage {
  id: string;
  content: string;
  isFromUser: boolean;
  createdAt: string;
}

// Promo code validation
export interface PromoValidation {
  valid: boolean;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicableTicketTypes?: string[];
  message?: string;
}

// Homepage types
export interface HomepageData {
  featuredEvents: Event[];
  nearbyEvents: Event[];
  categories: Category[];
  upcomingEvents: Event[];
  popularEvents: Event[];
}

// Event speaker and agenda
export interface EventSpeaker {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  photoUrl?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface EventAgenda {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  speakerId?: string;
  speaker?: EventSpeaker;
  location?: string;
}

// Refund types
export interface RefundRequest {
  id: string;
  orderId: string;
  reason: string;
  status: 'pending' | 'approved' | 'processed' | 'failed' | 'canceled';
  amount: number;
  createdAt: string;
  processedAt?: string;
}
