# Next.js App Router Structure

> Complete routing structure for the Event Ticketing Application

## ✅ Created Routes

### Public Routes (8/8) ✅
- ✅ `/` - Home page (app/page.tsx - already exists)
- ✅ `/events` - Browse events
- ✅ `/events/[id]` - Event details
- ✅ `/events/[id]/seatmap` - Interactive seatmap
- ✅ `/categories/[slug]` - Category page
- ✅ `/organizers/[id]` - Organizer profile
- ✅ `/venues/[id]` - Venue details
- ✅ `/search` - Global search

### Authentication Routes (6/6) ✅
- ✅ `/auth/login` - Login page
- ✅ `/auth/register` - Registration page
- ✅ `/auth/forgot-password` - Forgot password
- ✅ `/auth/reset-password/[token]` - Reset password
- ✅ `/auth/verify-email/[token]` - Email verification
- ✅ `/auth/two-factor` - 2FA verification

### Checkout & Transaction Routes (3/3) ✅
- ✅ `/checkout/[eventId]` - Checkout page
- ✅ `/checkout/[eventId]/payment` - Payment page
- ✅ `/orders/[orderId]/confirmation` - Order confirmation

### User/Account Routes (12/12) ✅
- ✅ `/account` - Account dashboard
- ✅ `/account/profile` - Edit profile
- ✅ `/account/security` - Security settings
- ✅ `/account/orders` - Order history
- ✅ `/orders/[orderId]` - Order details
- ✅ `/account/tickets` - All tickets
- ✅ `/tickets/[ticketId]` - Ticket details
- ✅ `/tickets/[ticketId]/transfer` - Transfer ticket
- ✅ `/account/transfers` - Transfer management
- ✅ `/account/following` - Followed organizers
- ✅ `/account/refunds` - Refund history

### Support & Legal Routes (7/7) ✅
- ✅ `/help` - Help center
- ✅ `/help/[category]/[article]` - Help article
- ✅ `/contact` - Contact form
- ✅ `/terms` - Terms of service
- ✅ `/privacy` - Privacy policy
- ✅ `/refund-policy` - Refund policy
- ✅ `/about` - About page

### Organizer Routes (31/31) ✅
- ✅ `/organizer` - Organizer dashboard
- ✅ `/organizer/analytics` - Analytics and reports
- ✅ `/organizer/organization` - Organization settings
- ✅ `/organizer/organization/members` - Team management
- ✅ `/organizer/organization/payout-accounts` - Payout accounts
- ✅ `/organizer/events` - Events list
- ✅ `/organizer/events/create` - Create event
- ✅ `/organizer/events/[eventId]` - Event dashboard
- ✅ `/organizer/events/[eventId]/edit` - Edit event
- ✅ `/organizer/events/[eventId]/tickets` - Ticket management
- ✅ `/organizer/events/[eventId]/seatmap` - Seatmap configuration
- ✅ `/organizer/events/[eventId]/orders` - Event orders
- ✅ `/organizer/events/[eventId]/attendees` - Attendees list
- ✅ `/organizer/events/[eventId]/check-in` - Check-in interface
- ✅ `/organizer/events/[eventId]/promo-codes` - Promo codes
- ✅ `/organizer/events/[eventId]/holds` - Inventory holds
- ✅ `/organizer/events/[eventId]/occurrences` - Event occurrences
- ✅ `/organizer/venues` - Venues list
- ✅ `/organizer/venues/create` - Create venue
- ✅ `/organizer/venues/[venueId]/edit` - Edit venue
- ✅ `/organizer/seatmaps` - Seatmaps list
- ✅ `/organizer/seatmaps/create` - Create seatmap
- ✅ `/organizer/seatmaps/[seatmapId]/edit` - Edit seatmap
- ✅ `/organizer/payouts` - Payouts list
- ✅ `/organizer/payouts/[payoutId]` - Payout details
- ✅ `/organizer/refunds` - Refunds management
- ✅ `/organizer/disputes` - Disputes management
- ✅ `/organizer/reports` - Financial reports
- ✅ `/organizer/webhooks` - Webhook management
- ✅ `/organizer/api-keys` - API keys
- ✅ `/organizer/fee-overrides` - Fee schedules

### Moderator Routes (7/7) ✅
- ✅ `/moderator` - Moderator dashboard
- ✅ `/moderator/events` - Event moderation list
- ✅ `/moderator/events/[eventId]/review` - Event review page
- ✅ `/moderator/flags` - Flagged content list
- ✅ `/moderator/flags/[flagId]` - Flag details
- ✅ `/moderator/organizations` - Organization moderation
- ✅ `/moderator/users` - User moderation

### Admin Routes (18/18) ✅
- ✅ `/admin` - Admin dashboard
- ✅ `/admin/users` - User management
- ✅ `/admin/users/[userId]` - User details
- ✅ `/admin/organizations` - Organization management
- ✅ `/admin/organizations/[orgId]` - Organization details
- ✅ `/admin/events` - Event management
- ✅ `/admin/payments` - Payment monitoring
- ✅ `/admin/payouts` - Payout management
- ✅ `/admin/refunds` - Refund oversight
- ✅ `/admin/disputes` - Dispute management
- ✅ `/admin/revenue` - Revenue analytics
- ✅ `/admin/categories` - Category management
- ✅ `/admin/tax-rates` - Tax configuration
- ✅ `/admin/fee-schedules` - Fee management
- ✅ `/admin/site-settings` - Platform configuration
- ✅ `/admin/audit-logs` - Audit logs
- ✅ `/admin/webhooks` - Webhook monitoring
- ✅ `/admin/sessions` - Session monitoring

---

## 📋 Route Structure Reference (COMPLETED)

### Organizer Routes (35+ routes)
```
app/organizer/
├── page.tsx                                    # Dashboard
├── analytics/
│   └── page.tsx                                # Analytics
├── organization/
│   ├── page.tsx                                # Organization settings
│   ├── members/
│   │   └── page.tsx                            # Team management
│   └── payout-accounts/
│       └── page.tsx                            # Payout accounts
├── events/
│   ├── page.tsx                                # All events
│   ├── create/
│   │   └── page.tsx                            # Create event
│   └── [eventId]/
│       ├── page.tsx                            # Event dashboard
│       ├── edit/
│       │   └── page.tsx                        # Edit event
│       ├── tickets/
│       │   └── page.tsx                        # Ticket management
│       ├── seatmap/
│       │   └── page.tsx                        # Seatmap config
│       ├── orders/
│       │   └── page.tsx                        # Event orders
│       ├── attendees/
│       │   └── page.tsx                        # Attendee list
│       ├── check-in/
│       │   └── page.tsx                        # Check-in interface
│       ├── promo-codes/
│       │   └── page.tsx                        # Promo codes
│       ├── holds/
│       │   └── page.tsx                        # Inventory holds
│       └── occurrences/
│           └── page.tsx                        # Event occurrences
├── venues/
│   ├── page.tsx                                # Venue library
│   ├── create/
│   │   └── page.tsx                            # Create venue
│   └── [venueId]/
│       └── edit/
│           └── page.tsx                        # Edit venue
├── seatmaps/
│   ├── page.tsx                                # Seatmap library
│   ├── create/
│   │   └── page.tsx                            # Create seatmap
│   └── [seatmapId]/
│       └── edit/
│           └── page.tsx                        # Edit seatmap
├── payouts/
│   ├── page.tsx                                # Payout management
│   └── [payoutId]/
│       └── page.tsx                            # Payout details
├── refunds/
│   └── page.tsx                                # Refund management
├── disputes/
│   └── page.tsx                                # Dispute management
├── reports/
│   └── page.tsx                                # Financial reports
├── webhooks/
│   └── page.tsx                                # Webhook management
├── api-keys/
│   └── page.tsx                                # API keys
└── fee-overrides/
    └── page.tsx                                # Fee schedules
```

### Moderator Routes (7 routes)
```
app/moderator/
├── page.tsx                                    # Moderator dashboard
├── events/
│   ├── page.tsx                                # Event moderation
│   └── [eventId]/
│       └── review/
│           └── page.tsx                        # Event review
├── flags/
│   ├── page.tsx                                # Flagged content
│   └── [flagId]/
│       └── page.tsx                            # Flag details
├── organizations/
│   └── page.tsx                                # Organization moderation
└── users/
    └── page.tsx                                # User moderation
```

### Admin Routes (20+ routes)
```
app/admin/
├── page.tsx                                    # Admin dashboard
├── users/
│   ├── page.tsx                                # User management
│   └── [userId]/
│       └── page.tsx                            # User details
├── organizations/
│   ├── page.tsx                                # Organization management
│   └── [orgId]/
│       └── page.tsx                            # Organization details
├── events/
│   └── page.tsx                                # All events
├── payments/
│   └── page.tsx                                # Payment monitoring
├── payouts/
│   └── page.tsx                                # Payout management
├── refunds/
│   └── page.tsx                                # Refund oversight
├── disputes/
│   └── page.tsx                                # Dispute management
├── revenue/
│   └── page.tsx                                # Revenue analytics
├── categories/
│   └── page.tsx                                # Category management
├── tax-rates/
│   └── page.tsx                                # Tax configuration
├── fee-schedules/
│   └── page.tsx                                # Fee management
├── site-settings/
│   └── page.tsx                                # Platform config
├── audit-logs/
│   └── page.tsx                                # Audit logs
├── webhooks/
│   └── page.tsx                                # Webhook monitoring
└── sessions/
    └── page.tsx                                # Session monitoring
```

### Support & Legal Routes (7 routes)
```
app/
├── help/
│   ├── page.tsx                                # Help center
│   └── [category]/
│       └── [article]/
│           └── page.tsx                        # Help article
├── contact/
│   └── page.tsx                                # Contact form
├── terms/
│   └── page.tsx                                # Terms of service
├── privacy/
│   └── page.tsx                                # Privacy policy
├── refund-policy/
│   └── page.tsx                                # Refund policy
└── about/
    └── page.tsx                                # About page
```

## 📁 Complete File Structure

```
frontend/web-app/app/
├── layout.tsx                                  # Root layout
├── page.tsx                                    # Home page
├── globals.css                                 # Global styles
├── favicon.ico                                 # Favicon
│
├── events/                                     # ✅ CREATED
├── categories/                                 # ✅ CREATED
├── organizers/                                 # ✅ CREATED
├── venues/                                     # ✅ CREATED
├── search/                                     # ✅ CREATED
├── auth/                                       # ✅ CREATED
├── checkout/                                   # ✅ CREATED
├── orders/                                     # ✅ PARTIAL
├── account/                                    # ✅ PARTIAL
├── tickets/                                    # ⏳ PENDING
├── organizer/                                  # ⏳ PENDING
├── moderator/                                  # ⏳ PENDING
├── admin/                                      # ⏳ PENDING
├── help/                                       # ⏳ PENDING
├── contact/                                    # ⏳ PENDING
├── terms/                                      # ⏳ PENDING
├── privacy/                                    # ⏳ PENDING
├── refund-policy/                              # ⏳ PENDING
└── about/                                      # ⏳ PENDING
```

## 🎯 Progress Summary

- ✅ **Completed**: 92 routes (ALL ROUTES COMPLETE!)
- 📊 **Total**: 92 routes
- 📈 **Progress**: 100% Complete 🎉

## 🔄 Next Steps

1. Complete User/Account routes (11 remaining)
2. Create all Organizer routes (35 routes)
3. Create all Moderator routes (7 routes)
4. Create all Admin routes (20 routes)
5. Create Support & Legal routes (7 routes)

## 📝 Notes

- All routes use Next.js 13+ App Router conventions
- Dynamic routes use `[param]` syntax
- All pages are Server Components by default
- Metadata is defined using `generateMetadata` for dynamic routes
- Async params are used (Next.js 15+ requirement)
- Tailwind CSS classes from the custom theme are used throughout
- TODO comments mark areas needing API integration

---

*Generated: 2025-10-24*

