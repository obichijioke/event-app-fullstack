# TypeScript Type Definitions

## Core Types

```typescript
// types/index.ts

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'attendee' | 'organizer' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

// Organization Types
export interface Organization {
  id: string;
  ownerId: string;
  name: string;
  legalName?: string;
  website?: string;
  country?: string;
  supportEmail?: string;
  taxId?: string;
  status: 'pending' | 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  _count?: {
    events: number;
    members: number;
    venues: number;
  };
}

export interface OrganizationMember {
  id: string;
  userId: string;
  orgId: string;
  role: 'owner' | 'manager' | 'staff';
  invitedBy?: string;
  joinedAt: string;
  user: User;
}

export interface CreateOrganizationRequest {
  name: string;
  legalName?: string;
  website?: string;
  country?: string;
  supportEmail?: string;
  taxId?: string;
}

export interface AddMemberRequest {
  email: string;
  role: 'owner' | 'manager' | 'staff';
}

// Event Types
export interface Event {
  id: string;
  orgId: string;
  title: string;
  description?: string; // maps to descriptionMd
  categoryId?: string;
  venueId?: string;
  seatmapId?: string;
  startAt?: string; // Prisma startAt
  endAt?: string; // Prisma endAt
  doorTime?: string; // Prisma doorTime
  status: 'draft' | 'pending' | 'approved' | 'live' | 'paused' | 'ended' | 'canceled';
  visibility?: 'public' | 'unlisted' | 'private';
  ageRestriction?: string; // Prisma uses string text
  coverImageUrl?: string;
  latitude?: number; // Prisma Decimal(10,8)
  longitude?: number; // Prisma Decimal(11,8)
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
  venue?: Venue;
  occurrences?: EventOccurrence[];
  assets?: EventAsset[];
  policies?: EventPolicies;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  categoryId?: string;
  venueId?: string;
  seatmapId?: string;
  timezone: string;
  currency: string;
  isPublic?: boolean;
  requiresApproval?: boolean;
  ageRestriction?: number;
}

export interface EventOccurrence {
  id: string;
  eventId: string;
  startsAt: string;
  endsAt: string;
  doorsOpenAt?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface EventAsset {
  id: string;
  eventId: string;
  kind: 'image' | 'pdf' | 'video' | 'seatmap-render';
  url: string;
  altText?: string;
  createdAt: string;
}

export interface EventPolicies {
  id: string;
  eventId: string;
  refundPolicy: 'none' | 'partial' | 'full';
  refundDeadlineHours?: number;
  transferPolicy: 'not_allowed' | 'allowed' | 'allowed_with_fee';
  transferFee?: number;
  cancellationPolicy?: string;
}

// Venue Types
export interface Venue {
  id: string;
  orgId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  capacity?: number;
  timezone: string;
  latitude?: number; // Prisma Decimal(10,8)
  longitude?: number; // Prisma Decimal(11,8)
  createdAt: string;
  updatedAt: string;
}

// Follow Types
export interface UserFollow {
  id: string;
  userId: string;
  organizationId: string;
  createdAt: string;
}

// Ticketing Types
export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;
  quantity: number;
  sold: number;
  minPerOrder: number;
  maxPerOrder: number;
  salesStartAt?: string;
  salesEndAt?: string;
  isPublic: boolean;
  status: 'active' | 'paused' | 'sold_out';
  createdAt: string;
  updatedAt: string;
}

export interface PriceTier {
  id: string;
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  startsAt?: string;
  endsAt?: string;
  status: 'active' | 'expired' | 'sold_out';
  createdAt: string;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  subtotal: number;
  fees: number;
  discount: number;
  total: number;
  currency: string;
  paymentProvider?: string;
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  tickets?: Ticket[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  ticketTypeId: string;
  priceTierId?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  ticketType?: TicketType;
}

export interface CreateOrderRequest {
  eventId: string;
  items: {
    ticketTypeId: string;
    quantity: number;
    priceTierId?: string;
  }[];
  promoCode?: string;
}

// Ticket Types
export interface Ticket {
  id: string;
  orderId: string;
  ticketTypeId: string;
  userId: string;
  status: 'valid' | 'used' | 'cancelled' | 'transferred';
  qrCode: string;
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  ticketType?: TicketType;
  order?: Order;
}

export interface TicketTransfer {
  id: string;
  ticketId: string;
  fromUserId: string;
  toEmail: string;
  toUserId?: string;
  status: 'pending' | 'completed' | 'cancelled';
  message?: string;
  createdAt: string;
  completedAt?: string;
}

// Promotion Types
export interface Promotion {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_tickets';
  discountValue: number;
  startsAt?: string;
  endsAt?: string;
  maxUses?: number;
  usedCount: number;
  status: 'active' | 'paused' | 'expired';
  createdAt: string;
}

export interface PromoCode {
  id: string;
  promotionId: string;
  code: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  status: 'active' | 'expired' | 'depleted';
  createdAt: string;
}

// API Response Types
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

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
```
