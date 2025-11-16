# Admin Dashboard - Unimplemented Features Analysis

This document provides a comprehensive analysis of admin dashboard features, comparing frontend pages with backend API endpoints to identify unimplemented or partially implemented features.

## Summary

**Total Admin Pages:** 20  
**Fully Implemented:** 13  
**Stub Pages (Not Implemented):** 6  
**Partial Implementation:** 1

---

## Frontend Admin Pages (from sidebar navigation)

### ✅ Fully Implemented Features

#### 1. **Dashboard** (`/admin`)
- **Frontend:** Implemented with `AdminDashboardContent` component
- **Backend:** `GET /admin/metrics` endpoint exists
- **Status:** ✅ COMPLETE
- **Features:**
  - Total users count
  - Active events count
  - Total revenue
  - Conversion rate metrics

#### 2. **User Management** (`/admin/users`)
- **Frontend:** Implemented with `UserList` component
- **Backend:** Full CRUD + advanced actions
- **Status:** ✅ COMPLETE
- **API Endpoints:**
  - `GET /admin/users` - List with pagination/filters
  - `GET /admin/users/:id` - Get user details
  - `PATCH /admin/users/:id` - Update user
  - `POST /admin/users/:id/suspend` - Suspend user
  - `POST /admin/users/:id/activate` - Activate user
  - `DELETE /admin/users/:id` - Delete user
  - `POST /admin/users/:id/grant-role` - Grant platform role
  - `POST /admin/users/:id/revoke-role` - Revoke platform role

#### 3. **User Details & Role Management** (`/admin/users/[userId]` & `/admin/users/[userId]/manage`)
- **Frontend:** Implemented with user detail and `RoleManagement` components
- **Backend:** Uses user management endpoints
- **Status:** ✅ COMPLETE

#### 4. **Organizations** (`/admin/organizations`)
- **Frontend:** Implemented with `OrganizationList` component
- **Backend:** Full CRUD + verification system
- **Status:** ✅ COMPLETE
- **API Endpoints:**
  - `GET /admin/organizations` - List with pagination/filters
  - `GET /admin/organizations/:id` - Get organization details
  - `PATCH /admin/organizations/:id` - Update organization
  - `GET /admin/organizations/verification` - List orgs for verification
  - `GET /admin/organizations/:id/verification` - Get verification details
  - `POST /admin/organizations/:id/verification/submit` - Submit for verification
  - `POST /admin/organizations/:id/verification/documents` - Upload documents
  - `POST /admin/organizations/verification/documents/:id/review` - Review document
  - `POST /admin/organizations/:id/verification/approve` - Approve organization
  - `POST /admin/organizations/:id/verification/reject` - Reject organization
  - `POST /admin/organizations/:id/verification/suspend` - Suspend organization
  - `POST /admin/organizations/verification/appeals/:id/review` - Review appeal

#### 5. **Events** (`/admin/events`)
- **Frontend:** Implemented with `EventList` and `EventDetail` components
- **Backend:** List, get, and status management
- **Status:** ✅ COMPLETE
- **API Endpoints:**
  - `GET /admin/events` - List with pagination/filters
  - `GET /admin/events/:id` - Get event details
  - `PATCH /admin/events/:id/status` - Update event status

#### 6. **Venues** (`/admin/venues`)
- **Frontend:** Implemented with `VenueManagement` component
- **Backend:** Full venue catalog and venue management
- **Status:** ✅ COMPLETE
- **API Endpoints:**
  - `GET /admin/venues/catalog` - List catalog entries
  - `GET /admin/venues/catalog/:id` - Get catalog entry
  - `POST /admin/venues/catalog` - Create catalog entry
  - `PATCH /admin/venues/catalog/:id` - Update catalog entry
  - `DELETE /admin/venues/catalog/:id` - Delete catalog entry
  - `POST /admin/venues/catalog/import` - Import from JSON
  - `GET /admin/venues` - List all venues
  - `GET /admin/venues/:id` - Get venue details
  - `DELETE /admin/venues/:id` - Archive venue
  - `POST /admin/venues/:id/restore` - Restore archived venue

#### 7. **Payments** (`/admin/payments`)
- **Frontend:** Implemented with `PaymentList` component
- **Backend:** Payment listing
- **Status:** ✅ COMPLETE
- **API Endpoints:**
  - `GET /admin/payments` - List with pagination/filters

#### 8. **Payouts** (`/admin/payouts`)
- **Frontend:** Implemented with `PayoutList` component
- **Backend:** Payout management
- **Status:** ✅ COMPLETE
- **API Endpoints:**
  - `GET /admin/payouts` - List with pagination/filters
  - `POST /admin/payouts/:id/approve` - Approve payout

#### 9. **Refunds** (`/admin/refunds`)
- **Frontend:** Implemented with `RefundList` component
- **Backend:** Full refund management
- **Status:** ✅ COMPLETE
- **API Endpoints:**
  - `GET /admin/refunds` - List with pagination/filters
  - `GET /admin/refunds/:id` - Get refund details
  - `POST /admin/refunds` - Create refund
  - `PATCH /admin/refunds/:id/status` - Update refund status
  - `POST /admin/refunds/:id/approve` - Approve refund
  - `POST /admin/refunds/:id/reject` - Reject refund
  - `POST /admin/refunds/:id/process` - Process refund with payment provider

#### 10. **Categories** (`/admin/categories`)
- **Frontend:** Implemented with `CategoryManagement` component
- **Backend:** Full CRUD
- **Status:** ✅ COMPLETE
- **API Endpoints:**
  - `GET /admin/categories` - List categories
  - `GET /admin/categories/:id` - Get category
  - `POST /admin/categories` - Create category
  - `PATCH /admin/categories/:id` - Update category
  - `DELETE /admin/categories/:id` - Delete category

#### 11. **Site Settings** (`/admin/site-settings`)
- **Frontend:** Implemented with `SiteSettingsForm` component
- **Backend:** Settings management
- **Status:** ✅ COMPLETE
- **API Endpoints:**
  - `GET /admin/settings` - Get site settings
  - `PATCH /admin/settings` - Update site settings

#### 12. **Audit Logs** (`/admin/audit-logs`)
- **Frontend:** Implemented with `AuditLogList` component
- **Backend:** Audit log retrieval
- **Status:** ✅ COMPLETE
- **API Endpoints:**
  - `GET /admin/audit-logs` - List with pagination/filters

---

### ❌ Not Implemented Features (Stub Pages Only)

#### 1. **Disputes** (`/admin/disputes`)
- **Frontend:** ❌ Stub page with TODO comment
- **Backend:** ❌ NO endpoints exist
- **Database:** ✅ `Dispute` model exists in schema
- **Status:** NOT IMPLEMENTED
- **Database Model Fields:**
  ```prisma
  model Dispute {
    id          String
    orderId     String
    provider    String
    caseId      String
    status      String
    amountCents BigInt?
    reason      String?
    openedAt    DateTime
    closedAt    DateTime?
    order       Order
  }
  ```
- **Missing Implementation:**
  - List disputes endpoint (`GET /admin/disputes`)
  - Get dispute details (`GET /admin/disputes/:id`)
  - Update dispute status (`PATCH /admin/disputes/:id/status`)
  - Respond to dispute (`POST /admin/disputes/:id/respond`)
  - Filter by status, provider, date range
  - Frontend component to display and manage disputes

#### 2. **Revenue Analytics** (`/admin/revenue`)
- **Frontend:** ❌ Stub page with TODO comment
- **Backend:** ⚠️ PARTIAL - Only basic metrics in dashboard
- **Status:** NOT IMPLEMENTED
- **Current Implementation:**
  - Basic revenue sum in dashboard metrics
- **Missing Implementation:**
  - Detailed revenue breakdown endpoint
  - Revenue by time period (daily, weekly, monthly)
  - Revenue by event/category
  - Revenue by organization
  - Platform fees collected
  - Processing fees breakdown
  - Revenue charts and graphs
  - Export functionality
  - Frontend revenue analytics dashboard

#### 3. **Tax Rates** (`/admin/tax-rates`)
- **Frontend:** ❌ Stub page with TODO comment
- **Backend:** ❌ NO endpoints exist
- **Database:** ✅ `TaxRate` model exists in schema
- **Status:** NOT IMPLEMENTED
- **Database Model Fields:**
  ```prisma
  model TaxRate {
    id        String
    country   String
    region    String?
    city      String?
    postal    String?
    rate      Decimal
    name      String
    active    Boolean
    createdAt DateTime
  }
  ```
- **Missing Implementation:**
  - List tax rates endpoint (`GET /admin/tax-rates`)
  - Get tax rate details (`GET /admin/tax-rates/:id`)
  - Create tax rate (`POST /admin/tax-rates`)
  - Update tax rate (`PATCH /admin/tax-rates/:id`)
  - Delete/deactivate tax rate (`DELETE /admin/tax-rates/:id`)
  - Filter by country, region, active status
  - Frontend tax rate management component

#### 4. **Fee Schedules** (`/admin/fee-schedules`)
- **Frontend:** ❌ Stub page with TODO comment
- **Backend:** ❌ NO endpoints exist
- **Database:** ✅ `FeeSchedule` model exists in schema
- **Status:** NOT IMPLEMENTED
- **Database Model Fields:**
  ```prisma
  model FeeSchedule {
    id              String
    kind            String  // 'platform', 'processing'
    name            String
    percent         Decimal
    fixedCents      BigInt
    currency        String?
    active          Boolean
    createdAt       DateTime
    orgFeeOverrides OrgFeeOverride[]
  }
  
  model OrgFeeOverride {
    id            String
    orgId         String
    feeScheduleId String
    startsAt      DateTime?
    endsAt        DateTime?
    org           Organization
    feeSchedule   FeeSchedule
  }
  ```
- **Missing Implementation:**
  - List fee schedules endpoint (`GET /admin/fee-schedules`)
  - Get fee schedule details (`GET /admin/fee-schedules/:id`)
  - Create fee schedule (`POST /admin/fee-schedules`)
  - Update fee schedule (`PATCH /admin/fee-schedules/:id`)
  - Delete/deactivate fee schedule (`DELETE /admin/fee-schedules/:id`)
  - Manage organization fee overrides
  - Frontend fee schedule management component
  - Fee calculator/preview

#### 5. **Session Monitoring** (`/admin/sessions`)
- **Frontend:** ❌ Stub page with TODO comment
- **Backend:** ❌ NO admin endpoints exist
- **Database:** ✅ `UserSession` model exists in schema
- **Status:** NOT IMPLEMENTED
- **Database Model Fields:**
  ```prisma
  model UserSession {
    id        String
    userId    String
    userAgent String?
    ipAddr    String?
    createdAt DateTime
    expiresAt DateTime
    revokedAt DateTime?
    user      User
  }
  ```
- **Current Implementation:**
  - Sessions are created/managed in auth service
  - No admin monitoring endpoints
- **Missing Implementation:**
  - List active sessions endpoint (`GET /admin/sessions`)
  - Get session details (`GET /admin/sessions/:id`)
  - Revoke session (`POST /admin/sessions/:id/revoke`)
  - Revoke all user sessions (`POST /admin/sessions/revoke-user/:userId`)
  - Filter by user, IP address, date range
  - Session analytics (active sessions, concurrent users)
  - Frontend session monitoring dashboard

#### 6. **Webhook Monitoring** (`/admin/webhooks`)
- **Frontend:** ❌ Stub page with TODO comment
- **Backend:** ⚠️ PARTIAL - Org-level webhooks exist, no admin monitoring
- **Database:** ✅ `WebhookEndpoint`, `WebhookEvent`, `WebhookAttempt` models exist
- **Status:** PARTIAL IMPLEMENTATION
- **Database Model Fields:**
  ```prisma
  model WebhookEndpoint {
    id           String
    orgId        String?
    url          String
    secret       String
    eventFilters String[]
    active       Boolean
    createdAt    DateTime
    org          Organization?
    attempts     WebhookAttempt[]
  }
  
  model WebhookEvent {
    id        String
    topic     String
    payload   Json
    createdAt DateTime
    attempts  WebhookAttempt[]
  }
  
  model WebhookAttempt {
    id             String
    webhookEventId String
    endpointId     String
    statusCode     Int?
    success        Boolean
    errorMessage   String?
    attemptedAt    DateTime
    retryCount     Int
    webhookEvent   WebhookEvent
    endpoint       WebhookEndpoint
  }
  ```
- **Current Implementation:**
  - Organization-level webhook management exists (`/webhooks/orgs/:orgId/webhooks`)
  - No admin-wide monitoring
- **Missing Implementation:**
  - Admin list all webhooks endpoint (`GET /admin/webhooks`)
  - List webhook events (`GET /admin/webhook-events`)
  - List webhook attempts (`GET /admin/webhook-attempts`)
  - Webhook health monitoring
  - Retry failed webhooks (`POST /admin/webhook-attempts/:id/retry`)
  - Webhook analytics (success rates, failure reasons)
  - Frontend webhook monitoring dashboard

---

## Missing Backend Services

The following backend services need to be created:

1. **AdminDisputeService** - Dispute management
2. **AdminRevenueService** - Revenue analytics and reporting
3. **AdminTaxRateService** - Tax rate configuration
4. **AdminFeeScheduleService** - Fee schedule management
5. **AdminSessionService** - User session monitoring
6. **AdminWebhookService** - Webhook monitoring (admin view)

---

## Missing DTOs

The following DTOs need to be created for the unimplemented features:

### Dispute DTOs
- `DisputeQueryDto` - Pagination and filtering
- `UpdateDisputeStatusDto` - Status updates
- `RespondToDisputeDto` - Dispute responses

### Revenue DTOs
- `RevenueQueryDto` - Date ranges, grouping options
- `RevenueBreakdownDto` - Response structure

### Tax Rate DTOs
- `CreateTaxRateDto` - Create new tax rate
- `UpdateTaxRateDto` - Update existing tax rate
- `TaxRateQueryDto` - Filtering options

### Fee Schedule DTOs
- `CreateFeeScheduleDto` - Create new fee schedule
- `UpdateFeeScheduleDto` - Update existing fee schedule
- `FeeScheduleQueryDto` - Filtering options
- `CreateOrgFeeOverrideDto` - Organization-specific fee overrides

### Session Monitoring DTOs
- `SessionQueryDto` - Filtering and pagination
- `RevokeSessionDto` - Session revocation

### Webhook Monitoring DTOs
- `WebhookQueryDto` - Admin-level webhook queries
- `WebhookEventQueryDto` - Event filtering
- `WebhookAttemptQueryDto` - Attempt filtering
- `RetryWebhookDto` - Retry configuration

---

## Frontend Components to Create

1. **DisputeList** - Display and manage payment disputes
2. **RevenueAnalytics** - Revenue charts and analytics dashboard
3. **TaxRateManagement** - Tax rate configuration UI
4. **FeeScheduleManagement** - Fee schedule and override management
5. **SessionMonitor** - Active session monitoring and management
6. **WebhookMonitor** - Webhook health and attempt monitoring

---

## Priority Recommendations

### High Priority
1. **Disputes** - Critical for payment management and compliance
2. **Fee Schedules** - Core platform revenue functionality
3. **Tax Rates** - Required for legal compliance in many jurisdictions

### Medium Priority
4. **Revenue Analytics** - Important for business insights
5. **Session Monitoring** - Useful for security and user management

### Low Priority
6. **Webhook Monitoring** - Nice to have for debugging (org-level webhooks work)

---

## Implementation Checklist

For each unimplemented feature, the following steps are needed:

- [ ] **Backend:**
  - [ ] Create service file in `/api/src/admin/services/`
  - [ ] Create DTOs in `/api/src/admin/dto/`
  - [ ] Add endpoints to `/api/src/admin/admin.controller.ts`
  - [ ] Add service to `/api/src/admin/admin.module.ts`
  - [ ] Write unit tests
  - [ ] Write E2E tests

- [ ] **Frontend:**
  - [ ] Create component in `/frontend/web-app/components/admin/`
  - [ ] Update page to use component (remove stub)
  - [ ] Add API service methods to `/frontend/web-app/services/admin-api.service.ts`
  - [ ] Add TypeScript types/interfaces
  - [ ] Implement filters, pagination, and actions
  - [ ] Add error handling and loading states

---

## Notes

- All database models already exist in the Prisma schema
- The admin controller structure is well-established and easy to extend
- The frontend component pattern is consistent across implemented features
- Authentication and authorization (admin role guard) is already in place

---

**Generated:** 2025-11-16  
**Repository:** /home/user/event-app-fullstack
