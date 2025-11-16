# System Architecture

## Overview

The Event Management API is a multi-tenant SaaS platform designed to handle event creation, ticketing, payments, and attendee management at scale. The architecture follows a modular, domain-driven design with clear separation of concerns.

## High-Level Architecture

```
┌─────────────┐
│   Clients   │ (Web, Mobile, API Consumers)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         API Gateway / Load Balancer     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│         NestJS Application Layer         │
│  ┌────────────────────────────────────┐  │
│  │  Controllers (HTTP/REST Endpoints) │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────▼───────────────────────┐  │
│  │     Services (Business Logic)      │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────▼───────────────────────┐  │
│  │   Repositories (Data Access)       │  │
│  └────────────┬───────────────────────┘  │
└───────────────┼───────────────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Prisma │  │ Redis  │  │ Queue  │
│  ORM   │  │ Cache  │  │ (Bull) │
└───┬────┘  └────────┘  └────────┘
    │
    ▼
┌──────────────┐
│ PostgreSQL   │
└──────────────┘
```

## Core Modules

### 1. Authentication & Authorization

**Module**: `auth`

- **JWT-based authentication** with access and refresh tokens
- **API Keys** for programmatic access with scoped permissions
- **Session management** with database-backed sessions
- **Password hashing** using bcrypt
- **HTTP-only cookies** for refresh tokens (security)

**Flow**:
1. User registers/logs in → Credentials validated
2. Access token (15min) + Refresh token (7 days) issued
3. Access token sent in Authorization header
4. Refresh token stored in HTTP-only cookie
5. Token refresh via `/auth/refresh` endpoint

### 2. Multi-Tenancy (Organizations)

**Module**: `organizations`

Organizations are the primary tenant entity. Each organization:
- Has an owner and multiple members with roles (owner, manager, staff)
- Owns events, venues, seatmaps, and other resources
- Has isolated data and permissions

**Permission Model**:
- **Owner**: Full control, can delete organization
- **Manager**: Can manage events, tickets, and members
- **Staff**: Can view and assist with operations

**Implementation**:
- Organization ID is passed in request context
- Services verify membership before operations
- Database queries filter by organization ID

### 3. Event Management

**Module**: `events`

Events support:
- **Multiple occurrences** (recurring events)
- **Seatmap snapshots** (event-specific seating)
- **Event policies** (refund, transfer, cancellation)
- **Event assets** (images, PDFs, videos, seatmap renders)
- **Status workflow**: draft → published → completed/cancelled

**Database Triggers**:
- Auto-snapshot seatmap when event is created
- Update timestamps on changes
- Sync dispute status with orders

### 4. Ticketing System

**Module**: `ticketing`

**Ticket Types**:
- Base price and currency
- Quantity limits (total, min/max per order)
- Sales windows (start/end dates)
- Public/private visibility

**Price Tiers**:
- Time-based pricing (early bird, regular, late)
- Quantity-based pricing
- Automatic tier selection based on current time

**Holds**:
- Temporary inventory reservation
- Expiration-based release
- Used for group bookings and VIP allocations

**Inventory Management**:
- Atomic operations using database transactions
- Redis-based distributed locks for high concurrency
- Real-time availability checks

### 5. Order Processing

**Module**: `orders`

**Order Lifecycle**:
1. **Pending**: Order created, payment not processed
2. **Confirmed**: Payment successful, tickets issued
3. **Cancelled**: Order cancelled, inventory released
4. **Refunded**: Payment refunded, tickets invalidated

**Order Items**:
- Link to ticket type and price tier
- Quantity and unit price
- Subtotal calculation

**Pricing Calculation**:
```
Subtotal = Sum(item.quantity × item.unitPrice)
Discount = Promo code discount
Fees = Platform fees + Payment processing fees
Total = Subtotal - Discount + Fees
```

### 6. Payment Processing

**Module**: `payments`

**Supported Providers**:
- **Stripe**: International payments
- **Paystack**: African markets (primary for Nigeria)

**Payment Flow**:
1. Create order (status: pending)
2. Create payment intent with provider
3. Client confirms payment
4. Webhook receives confirmation
5. Order status updated to confirmed
6. Tickets generated and sent to user

**Idempotency**:
- Idempotency keys prevent duplicate charges
- Webhook events are deduplicated

### 7. Ticket Management

**Module**: `tickets`

**Ticket Features**:
- **QR codes** for check-in
- **Transfers** between users
- **Check-ins** tracked per occurrence
- **Status tracking**: valid, used, cancelled, transferred

**Transfer Flow**:
1. Owner initiates transfer to recipient email
2. Transfer record created (status: pending)
3. Recipient accepts transfer
4. Ticket ownership updated
5. Transfer status: completed

**Check-in**:
- QR code scanned at venue
- Validates ticket status and occurrence
- Prevents duplicate check-ins
- Records timestamp and location

### 8. Promotions

**Module**: `promotions`

**Promotion Types**:
- **Percentage discount**: e.g., 20% off
- **Fixed amount**: e.g., ₦5000 off
- **Free tickets**: e.g., buy 2 get 1 free

**Promo Codes**:
- Unique codes linked to promotions
- Usage limits (total and per user)
- Expiration dates
- Event-specific or organization-wide

### 9. Webhooks

**Module**: `webhooks`

**Event Types**:
- `order.created`, `order.confirmed`, `order.cancelled`
- `ticket.transferred`, `ticket.checkedin`
- `event.published`, `event.cancelled`

**Delivery**:
- Asynchronous delivery via Bull queue
- Retry logic with exponential backoff
- Signature verification (HMAC)
- Event log for debugging

### 10. Background Jobs

**Module**: `queue`

**Job Types**:
- **Email notifications**: Order confirmations, ticket transfers
- **Webhook delivery**: Event notifications to integrators
- **Hold expiration**: Release expired ticket holds
- **Report generation**: Analytics and exports
- **Payment reconciliation**: Match payments with orders

**Queue Configuration**:
- Redis-backed Bull queues
- Separate queues for different job types
- Configurable concurrency and retry policies

## Database Schema

### Key Relationships

```
User ──┬─── Session
       ├─── ApiKey
       ├─── Order ──── OrderItem ──── Ticket
       └─── OrganizationMember ──── Organization ──┬─── Event ──┬─── EventOccurrence
                                                    │            ├─── EventAsset
                                                    │            ├─── EventPolicies
                                                    │            ├─── TicketType ──┬─── PriceTier
                                                    │            │                  └─── Hold
                                                    │            └─── EventSeatmap
                                                    ├─── Venue
                                                    ├─── Seatmap ──── Seat
                                                    ├─── Promotion ──── PromoCode
                                                    └─── Webhook ──── WebhookEvent
```

### Important Indexes

- `users.email` (unique)
- `sessions.token` (unique)
- `api_keys.prefix` (for fast lookup)
- `events.org_id, status`
- `tickets.qr_code` (unique)
- `holds.expires_at` (for cleanup jobs)
- `orders.user_id, status`

### Database Triggers

1. **Seatmap Snapshot**: When event is created, snapshot the seatmap
2. **Timestamp Updates**: Auto-update `updated_at` on changes
3. **Dispute Sync**: Sync dispute status with order status

## Caching Strategy

**Redis Cache Usage**:
- **Session storage**: User sessions and refresh tokens
- **Rate limiting**: API rate limit counters
- **Inventory locks**: Distributed locks for ticket purchases
- **Event data**: Cache frequently accessed event details
- **User profiles**: Cache authenticated user data

**Cache Invalidation**:
- TTL-based expiration
- Manual invalidation on updates
- Cache-aside pattern

## Security Considerations

### Authentication
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with short expiration (15 minutes)
- Refresh tokens in HTTP-only cookies
- API keys hashed in database

### Authorization
- Role-based access control (RBAC)
- Organization membership verification
- Resource ownership checks

### Data Protection
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (input validation)
- CSRF protection (SameSite cookies)
- Rate limiting (1000 req/hour authenticated, 100 req/hour unauthenticated)

### Payment Security
- PCI compliance via Stripe/Paystack
- No credit card data stored
- Webhook signature verification
- Idempotency keys for payments

## Scalability Considerations

### Horizontal Scaling
- Stateless application servers
- Session data in Redis (shared state)
- Load balancer for traffic distribution

### Database Scaling
- Read replicas for read-heavy operations
- Connection pooling (Prisma)
- Indexed queries for performance
- Partitioning for large tables (orders, tickets)

### Caching
- Redis cluster for high availability
- Cache warming for popular events
- CDN for static assets

### Queue Processing
- Multiple worker processes
- Queue-based job distribution
- Automatic retry and dead-letter queues

### Performance Optimization
- Database query optimization
- N+1 query prevention (Prisma includes)
- Pagination for large datasets
- Lazy loading for related data

## Monitoring & Observability

### Logging
- Structured logging (JSON format)
- Log levels: error, warn, info, debug
- Request/response logging
- Error stack traces

### Metrics
- Request rate and latency
- Error rates
- Database query performance
- Queue job processing time
- Cache hit/miss rates

### Health Checks
- `/health` endpoint
- Database connectivity check
- Redis connectivity check
- Queue health check

## Deployment Architecture

### Production Setup
```
┌─────────────┐
│   Nginx     │ (SSL termination, load balancing)
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌─────┐ ┌─────┐
│ App │ │ App │ (Multiple instances)
└──┬──┘ └──┬──┘
   │       │
   └───┬───┘
       │
   ┌───┴────┬────────┐
   │        │        │
   ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐
│  DB  │ │Redis │ │Queue │
│Master│ │Cluster│ │Worker│
└───┬──┘ └──────┘ └──────┘
    │
    ▼
┌──────┐
│  DB  │
│Replica│
└──────┘
```

### Container Orchestration
- Docker containers for application
- Docker Compose for local development
- Kubernetes for production (optional)

## Future Enhancements

1. **GraphQL API**: Alternative to REST for flexible queries
2. **Real-time Updates**: WebSocket support for live ticket availability
3. **Mobile SDKs**: Native iOS/Android SDKs
4. **Analytics Dashboard**: Real-time event analytics
5. **Multi-currency**: Dynamic currency conversion
6. **Waitlist**: Automatic ticket allocation when available
7. **Seating Charts**: Interactive seat selection UI
8. **Social Features**: Event sharing, attendee networking

