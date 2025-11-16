# Frontend Pages & Routes Documentation

> Comprehensive list of all frontend pages/routes for the Event Ticketing Application
> Based on Prisma Schema Analysis

---

## Table of Contents

- [Public Pages](#public-pages)
- [Authentication Pages](#authentication-pages)
- [Checkout & Transaction Pages](#checkout--transaction-pages)
- [User/Customer Pages](#usercustomer-pages)
- [Organizer Pages](#organizer-pages)
- [Moderator Pages](#moderator-pages)
- [Admin Pages](#admin-pages)
- [Support & Legal Pages](#support--legal-pages)
- [Summary by Role](#summary-by-role)

---

## 🌐 Public Pages

### Home & Discovery

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/` | Landing page | Featured events, search, categories, trending organizers | Event, Category, Organization, Venue | No |
| `/events` | Browse all events | Advanced filtering, map view, list/grid toggle, pagination | Event, Category, Venue, TicketType | No |
| `/events/[id]` | Event details | Event info, tickets, venue, policies, organizer info | Event, EventAsset, EventPolicies, TicketType, Venue, Organization, EventOccurrence | No |
| `/events/[id]/seatmap` | Interactive seatmap | Visual seat selection, real-time availability, pricing | Event, EventSeatmap, Seatmap, Seat, TicketTypeSeat, Hold | No |
| `/categories/[slug]` | Events by category | Category-specific listing, subcategory navigation | Category, Event | No |
| `/organizers/[id]` | Organizer profile | Organizer info, events, follow/unfollow | Organization, Event, UserFollow | No |
| `/venues/[id]` | Venue details | Venue info, map, upcoming events | Venue, Event | No |
| `/search` | Global search | Search events, organizers, venues with filters | Event, Organization, Venue | No |

---

## 🔐 Authentication Pages

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/auth/login` | User login | Email/password, social login, remember me | User, UserSession | No |
| `/auth/register` | User registration | Signup form, email verification, terms acceptance | User | No |
| `/auth/forgot-password` | Password reset request | Email input, reset link | User | No |
| `/auth/reset-password/[token]` | Password reset form | New password input | User | No |
| `/auth/verify-email/[token]` | Email verification | Auto-verify, success/error messaging | User | No |
| `/auth/two-factor` | 2FA verification | Code input, backup codes | User, UserSession | No |

---

## 🛒 Checkout & Transaction Pages

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/checkout/[eventId]` | Ticket purchase | Ticket selection, seat selection, promo codes, timer | Event, TicketType, Seat, Hold, PromoCode, Order, OrderItem | Optional |
| `/checkout/[eventId]/payment` | Payment processing | Payment method, billing info, 3D Secure | Order, Payment | Yes |
| `/orders/[orderId]/confirmation` | Order confirmation | Order details, ticket download, add to calendar | Order, OrderItem, Ticket, Payment | Yes |

---

## 👤 User/Customer Pages

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/account` | User dashboard | Profile overview, stats, recent orders | User, Order, Ticket | Yes (attendee) |
| `/account/profile` | Edit profile | Update name, email, phone, password, picture | User | Yes (attendee) |
| `/account/security` | Security settings | 2FA, sessions, API keys, login history | User, UserSession, ApiKey | Yes (attendee) |
| `/account/orders` | Order history | All orders, filter by status/date, receipts | Order, OrderItem, Payment | Yes (attendee) |
| `/orders/[orderId]` | Order details | Full breakdown, tickets, payment, refund request | Order, OrderItem, Ticket, Payment, Refund | Yes (attendee) |
| `/account/tickets` | All tickets | Upcoming/past tickets, transfer, QR codes | Ticket, Event, TicketType, Seat | Yes (attendee) |
| `/tickets/[ticketId]` | Ticket view | QR code, details, transfer, add to wallet | Ticket, Event, TicketType, Seat, Order | Yes (attendee) |
| `/tickets/[ticketId]/transfer` | Transfer ticket | Recipient input, confirmation, history | Ticket, Transfer, User, EventPolicies | Yes (attendee) |
| `/account/transfers` | Transfer management | Sent/received transfers, accept/decline | Transfer, Ticket, User | Yes (attendee) |
| `/account/following` | Followed organizers | List, unfollow, upcoming events | UserFollow, Organization, Event | Yes (attendee) |
| `/account/refunds` | Refund history | Active requests, history, status tracking | Refund, Order | Yes (attendee) |

---

## 🎭 Organizer Pages

### Dashboard & Overview

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/organizer` | Main dashboard | Metrics, sales, revenue, recent orders, charts | Organization, Event, Order, Ticket, Payout | Yes (organizer) |
| `/organizer/analytics` | Analytics | Sales trends, revenue reports, geographic data | Event, Order, Ticket, OrderItem, TicketType | Yes (organizer) |

### Organization Management

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/organizer/organization` | Organization settings | Profile, legal info, tax ID, branding | Organization | Yes (owner/manager) |
| `/organizer/organization/members` | Team management | List members, invite, assign roles, remove | Organization, OrgMember, User | Yes (owner/manager) |
| `/organizer/organization/payout-accounts` | Payout accounts | Connected accounts, add new, set default | Organization, PayoutAccount | Yes (owner/finance) |

### Event Management

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/organizer/events` | All events | List all events, filter, stats, create button | Event, Organization | Yes (organizer) |
| `/organizer/events/create` | Create event | Multi-step form, venue, tickets, policies | Event, Venue, Category, Organization | Yes (organizer) |
| `/organizer/events/[eventId]/edit` | Edit event | Update details, tickets, policies, status | Event, TicketType, EventPolicies, EventAsset | Yes (organizer) |
| `/organizer/events/[eventId]` | Event dashboard | Overview, sales, charts, recent orders | Event, Order, Ticket, TicketType | Yes (organizer) |
| `/organizer/events/[eventId]/tickets` | Ticket management | Create/edit types, pricing, capacity, tiers | TicketType, TicketPriceTier, TicketTypeSeat | Yes (organizer) |
| `/organizer/events/[eventId]/seatmap` | Seatmap config | Assign seatmap, snapshot, pricing by section | Event, Seatmap, EventSeatmap, Seat | Yes (organizer) |
| `/organizer/events/[eventId]/orders` | Event orders | All orders, filter, search, export | Order, OrderItem, User, Payment | Yes (organizer) |
| `/organizer/events/[eventId]/attendees` | Attendee list | Ticket holders, filter, export, check-in status | Ticket, User, TicketType, Checkin | Yes (organizer) |
| `/organizer/events/[eventId]/check-in` | Check-in interface | QR scanner, manual lookup, real-time stats | Ticket, Checkin, Event | Yes (organizer/staff) |
| `/organizer/events/[eventId]/promo-codes` | Promo codes | Create codes, set discounts, limits, tracking | PromoCode, PromoRedemption, Event | Yes (organizer) |
| `/organizer/events/[eventId]/holds` | Inventory holds | Active holds, organizer holds, release/create | Hold, Event, TicketType, Seat | Yes (organizer) |
| `/organizer/events/[eventId]/occurrences` | Event occurrences | List, add, edit, delete occurrences | EventOccurrence, Event | Yes (organizer) |

### Venue & Seatmap Management

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/organizer/venues` | Venue library | List, create, edit, delete venues | Venue, Organization | Yes (organizer) |
| `/organizer/venues/create` | Create venue | Name, address, capacity, timezone, geolocation | Venue, Organization | Yes (organizer) |
| `/organizer/venues/[venueId]/edit` | Edit venue | Update info, view events | Venue, Event | Yes (organizer) |
| `/organizer/seatmaps` | Seatmap library | List, create, edit, delete, preview | Seatmap, Organization | Yes (organizer) |
| `/organizer/seatmaps/create` | Create seatmap | Builder/editor, sections, rows, seats | Seatmap, Seat, Organization | Yes (organizer) |
| `/organizer/seatmaps/[seatmapId]/edit` | Edit seatmap | Modify layout, add/remove seats | Seatmap, Seat | Yes (organizer) |

### Financial Management

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/organizer/payouts` | Payout management | History, pending, schedule, details | Payout, Organization | Yes (owner/finance) |
| `/organizer/payouts/[payoutId]` | Payout details | Breakdown, orders, provider info, statement | Payout, Order | Yes (owner/finance) |
| `/organizer/refunds` | Refund management | Pending requests, approve/reject, analytics | Refund, Order, User | Yes (owner/finance/manager) |
| `/organizer/disputes` | Dispute management | Active disputes, respond, upload evidence | Dispute, Order | Yes (owner/finance) |
| `/organizer/reports` | Financial reports | Revenue, sales, tax, fees, export | Order, Payment, OrderFeeLine, OrderTaxLine | Yes (owner/finance) |

### Settings & Integrations

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/organizer/webhooks` | Webhook management | List, create, configure, test, logs | WebhookEndpoint, WebhookEvent, WebhookAttempt | Yes (owner/manager) |
| `/organizer/api-keys` | API keys | List, generate, set scopes, revoke, usage | ApiKey, User | Yes (owner/manager) |
| `/organizer/fee-overrides` | Fee schedules | View overrides, request custom fees | OrgFeeOverride, FeeSchedule, Organization | Yes (owner) |

---

## 🛡️ Moderator Pages

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/moderator` | Moderator dashboard | Pending approvals, recent flags, queue | Event, Flag, ModerationAction | Yes (moderator) |
| `/moderator/events` | Event moderation | Pending events, review, approve/reject | Event, ModerationAction, Flag | Yes (moderator) |
| `/moderator/events/[eventId]/review` | Event review | Full details, notes, approve/reject/request changes | Event, ModerationAction, Flag, Organization | Yes (moderator) |
| `/moderator/flags` | Flagged content | All flags, filter, review, take action | Flag, ModerationAction, User, Event | Yes (moderator) |
| `/moderator/flags/[flagId]` | Flag details | Details, content preview, action, resolve | Flag, ModerationAction, User | Yes (moderator) |
| `/moderator/organizations` | Organization moderation | List, review, suspend/activate | Organization, ModerationAction, Event | Yes (moderator) |
| `/moderator/users` | User moderation | Search, view activity, suspend/ban | User, ModerationAction, Order, Ticket | Yes (moderator) |

---

## 👑 Admin Pages

### Platform Management

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/admin` | Admin dashboard | Platform metrics, revenue, users, system health | User, Organization, Event, Order, Payment | Yes (admin) |
| `/admin/users` | User management | List, search, view, change roles, suspend | User, UserSession, Order, Ticket | Yes (admin) |
| `/admin/users/[userId]` | User details | Profile, orders, tickets, sessions, audit log | User, Order, Ticket, UserSession, AuditLog | Yes (admin) |
| `/admin/organizations` | Organization management | List, search, approve/suspend, view events | Organization, Event, OrgMember, Payout | Yes (admin) |
| `/admin/organizations/[orgId]` | Organization details | Profile, members, events, payouts, analytics | Organization, OrgMember, Event, PayoutAccount | Yes (admin) |
| `/admin/events` | All events | List all, search, bulk actions, analytics | Event, Organization, TicketType, Order | Yes (admin) |

### Financial Management

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/admin/payments` | Payment monitoring | All payments, filter, failed, analytics | Payment, Order, Refund | Yes (admin) |
| `/admin/payouts` | Payout management | All payouts, approvals, failed, retry | Payout, Organization | Yes (admin) |
| `/admin/refunds` | Refund oversight | All refunds, approve/reject, analytics | Refund, Order, User | Yes (admin) |
| `/admin/disputes` | Dispute management | All disputes, resolution, analytics | Dispute, Order, Organization | Yes (admin) |
| `/admin/revenue` | Revenue analytics | Total revenue, by org, fees, trends, export | Order, Payment, OrderFeeLine, Payout | Yes (admin) |

### Configuration & Settings

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/admin/categories` | Category management | List, create/edit, hierarchy, delete, reorder | Category | Yes (admin) |
| `/admin/tax-rates` | Tax configuration | List, create/edit, geographic targeting | TaxRate | Yes (admin) |
| `/admin/fee-schedules` | Fee management | List, create/edit, platform/processing fees | FeeSchedule, OrgFeeOverride | Yes (admin) |
| `/admin/site-settings` | Platform config | General settings, email templates, feature flags | SiteSetting | Yes (admin) |

### Monitoring & Logs

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/admin/audit-logs` | Audit logs | All actions, filter, search, export | AuditLog, User | Yes (admin) |
| `/admin/webhooks` | Webhook monitoring | All endpoints, events, attempts, retry | WebhookEndpoint, WebhookEvent, WebhookAttempt | Yes (admin) |
| `/admin/sessions` | Session monitoring | Active sessions, revoke, analytics | UserSession, User | Yes (admin) |

---

## 📞 Support & Legal Pages

| Route | Purpose | Key Features | Related Models | Auth Required |
|-------|---------|--------------|----------------|---------------|
| `/help` | Help center | FAQ, search articles, contact support | None | No |
| `/help/[category]/[article]` | Help article | Article content, related articles | None | No |
| `/contact` | Contact form | Support form, categories, attachments | None | No |
| `/terms` | Terms of service | Terms content, version history | None | No |
| `/privacy` | Privacy policy | Privacy policy, cookie policy | None | No |
| `/refund-policy` | Refund policy | Platform refund policy details | None | No |
| `/about` | About page | Company info, mission, team | None | No |

---

## 📊 Summary by Role

### Public Access (15 pages)
- Home, Events, Event Details, Seatmap, Categories, Organizers, Venues, Search
- Auth: Login, Register, Forgot Password, Reset Password, Verify Email, 2FA
- Support: Help, Help Article, Contact, Terms, Privacy, Refund Policy, About

### Attendee (12 pages)
- Account Dashboard, Profile, Security
- Orders, Order Details
- Tickets, Ticket Details, Transfer Ticket, Transfers
- Following, Refunds
- Checkout (2 pages)

### Organizer (35+ pages)
- **Dashboard**: Main Dashboard, Analytics
- **Organization**: Settings, Members, Payout Accounts
- **Events**: List, Create, Edit, Dashboard, Tickets, Seatmap, Orders, Attendees, Check-in, Promo Codes, Holds, Occurrences
- **Venues**: List, Create, Edit
- **Seatmaps**: List, Create, Edit
- **Financial**: Payouts, Payout Details, Refunds, Disputes, Reports
- **Settings**: Webhooks, API Keys, Fee Overrides

### Moderator (7 pages)
- Dashboard, Events, Event Review, Flags, Flag Details, Organizations, Users

### Admin (20+ pages)
- **Platform**: Dashboard, Users, User Details, Organizations, Org Details, Events
- **Financial**: Payments, Payouts, Refunds, Disputes, Revenue
- **Config**: Categories, Tax Rates, Fee Schedules, Site Settings
- **Monitoring**: Audit Logs, Webhooks, Sessions

---

## 🎯 Total Pages: **90+ unique routes**

### Route Naming Conventions

- **Dynamic routes**: Use `[id]`, `[slug]`, `[token]` for dynamic segments
- **Nested routes**: Use folder structure (e.g., `/organizer/events/[eventId]/tickets`)
- **Role-based prefixes**: `/account`, `/organizer`, `/moderator`, `/admin`
- **Action suffixes**: `/create`, `/edit`, `/review` for specific actions

### Access Control Levels

1. **Public**: No authentication required
2. **Authenticated**: Any logged-in user
3. **Role-specific**: Requires specific platform role (attendee, organizer, moderator, admin)
4. **Permission-based**: Requires specific organization role (owner, manager, finance, staff)

---

*Last Updated: 2025-10-24*
*Based on: `api/prisma/schema.prisma`*

