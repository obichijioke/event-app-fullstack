# Organizer Dashboard Implementation

This document outlines the complete implementation of the Organizer Dashboard for the event management platform.

## Overview

The Organizer Dashboard provides a comprehensive interface for event organizers to manage their events, track sales, handle orders, and monitor their organization's performance.

## Architecture

### File Structure

```
lib/
├── types/
│   └── organizer.ts                    # TypeScript types for all organizer-related data
├── api/
│   └── organizer-api.ts                # API client functions for all organizer endpoints
└── stores/
    └── organizer-store.ts              # Zustand store for dashboard state management

components/
└── organizer/
    ├── layout/
    │   ├── organizer-layout.tsx        # Main layout wrapper
    │   ├── organizer-header.tsx        # Top navigation header
    │   └── organizer-sidebar.tsx       # Sidebar navigation menu
    ├── dashboard/
    │   └── dashboard-content.tsx       # Main dashboard content component
    ├── metric-card.tsx                 # Reusable metric display card
    ├── stat-card.tsx                   # Reusable statistics card
    ├── empty-state.tsx                 # Empty state component
    ├── order-item.tsx                  # Individual order display
    ├── event-item.tsx                  # Individual event display
    └── organization-selector.tsx       # Multi-organization selector dropdown

app/
└── (organizer)/
    ├── layout.tsx                      # Route group layout
    └── organizer/
        └── page.tsx                    # Main dashboard page
```

## Features Implemented

### 1. Dashboard Overview (`/organizer`)
- **Key Metrics Display**:
  - Upcoming Events count
  - Tickets Sold
  - Gross Revenue
  - Total Orders

- **Tasks Section** (conditional display):
  - Draft Events awaiting publication
  - Moderation Alerts requiring attention
  - Pending Payouts

- **Recent Activity**:
  - Recent Orders with buyer info and status
  - Upcoming Events with dates and status

- **Financial Summary**:
  - Gross Revenue
  - Fees breakdown
  - Net Revenue calculation

- **Quick Actions Sidebar**:
  - Event Wizard
  - Add Venue
  - Create Seatmap
  - View Analytics
  - Download Reports

### 2. API Integration

All endpoints from the specification are implemented:

#### Dashboard Overview
- `GET /organizer/dashboard?orgId={organizationId}`

#### Events Management
- `GET /organizer/events?orgId={organizationId}` - List events with filters
- `POST /organizer/events` - Create event
- `GET /organizer/events/{eventId}` - Get event details
- `PATCH /organizer/events/{eventId}` - Update event
- `DELETE /organizer/events/{eventId}` - Delete event
- `POST /organizer/events/{eventId}/publish` - Publish event
- `POST /organizer/events/{eventId}/pause` - Pause event
- `POST /organizer/events/{eventId}/cancel` - Cancel event
- Event occurrences, assets, and policies endpoints

#### Analytics
- `GET /organizer/events/{eventId}/analytics?orgId={organizationId}`
- `GET /organizer/organization/insights?orgId={organizationId}`

#### Orders & Attendees
- `GET /organizer/orders?orgId={organizationId}` - List orders with filters
- `GET /organizer/orders/{orderId}?orgId={organizationId}` - Get order details
- `POST /organizer/orders/{orderId}/refund?orgId={organizationId}` - Refund order
- `GET /organizer/events/{eventId}/attendees?orgId={organizationId}` - List attendees
- Ticket transfer and resend endpoints
- Manual check-in endpoints

#### Notifications & Moderation
- `GET /organizer/notifications?orgId={organizationId}`
- `POST /organizer/flags/{flagId}/resolve?orgId={organizationId}`

#### Financials & Payouts
- `GET /organizer/financials/summary?orgId={organizationId}`
- `GET /organizer/financials/orders/export?orgId={organizationId}`
- `GET /organizer/payouts?orgId={organizationId}` - List payouts
- `GET /organizer/payouts/{payoutId}?orgId={organizationId}` - Get payout details
- `POST /organizer/payouts?orgId={organizationId}` - Create payout
- `POST /organizer/payout-accounts?orgId={organizationId}` - Create payout account

#### Tickets & Inventory
- Ticket type CRUD operations
- Price tier management
- Bulk seat assignment
- `GET /organizer/events/{eventId}/inventory?orgId={organizationId}` - Get inventory snapshot
- Hold management endpoints

#### Promotions
- Promotion campaign CRUD operations
- Promo code management

#### Organization Settings
- `GET /organizer/organization?orgId={organizationId}`
- `PATCH /organizer/organization?orgId={organizationId}`
- Team member management endpoints

### 3. State Management

The `useOrganizerStore` Zustand store handles:
- Current organization selection
- List of all organizations the user belongs to
- Loading states
- Persistent storage using `localStorage`

### 4. Multi-Organization Support

The `OrganizationSelector` component provides:
- Dropdown to switch between organizations
- Display of current organization name and user's role
- Persistent selection across page reloads

### 5. Responsive Design

- Mobile-first approach
- Sidebar collapses on mobile devices
- Grid layouts adjust for different screen sizes
- Touch-friendly navigation

## Component Details

### MetricCard
Displays key performance indicators with:
- Label and value
- Optional icon
- Optional trend indicator (positive/negative)
- Loading skeleton state

### StatCard
Wrapper component for sections with:
- Title
- Optional action button/link
- Content area
- Consistent styling

### EmptyState
Shows when no data is available:
- Optional icon
- Title and description
- Optional call-to-action button

### OrderItem
Displays individual order information:
- Buyer name and email
- Event title
- Order status badge with color coding
- Total amount
- Created date
- Clickable to view order details

### EventItem
Displays individual event information:
- Event title
- Status badge with color coding
- Start date and time
- Clickable to view event details

## Design System

### Status Colors
```typescript
// Event Status
draft: gray
pending: yellow
approved: blue
live: green
paused: orange
canceled: red
completed: purple

// Order Status
paid: green
pending: yellow
refunded: gray
canceled: red
expired: gray
```

### Layout Structure
- Header height: 4rem (64px)
- Sidebar width: 16rem (256px)
- Container max-width: responsive
- Padding: Consistent 1.5rem (24px) spacing

## Usage Examples

### Loading Dashboard Data
```typescript
const { currentOrganization } = useOrganizerStore();
const data = await organizerApi.dashboard.getOverview(currentOrganization.id);
```

### Creating an Event
```typescript
const newEvent = await organizerApi.events.create({
  orgId: 'org_123',
  title: 'Launch Party',
  startAt: '2025-08-01T18:00:00.000Z',
  categoryId: 'cat_music',
});
```

### Switching Organizations
```typescript
const { setCurrentOrganization, organizations } = useOrganizerStore();
setCurrentOrganization(organizations[0]);
```

## API Client Configuration

The API client uses the configuration from `lib/api/client.ts`:
- Base URL: `process.env.NEXT_PUBLIC_API_URL` or `http://localhost:3001`
- Authentication: JWT token from `localStorage.getItem('accessToken')`
- Automatic token injection in headers
- Error handling with typed `ApiError`

## Next Steps

To extend the dashboard functionality:

1. **Add Charts/Graphs**: Integrate a charting library (Chart.js, Recharts) for:
   - Sales over time
   - Ticket type distribution
   - Revenue trends

2. **Real-time Updates**: Implement WebSocket connections for:
   - Live order notifications
   - Ticket sales updates
   - Event status changes

3. **Export Functionality**: Add CSV/Excel export for:
   - Order lists
   - Attendee lists
   - Financial reports

4. **Advanced Filtering**: Enhance filtering capabilities:
   - Date range pickers
   - Multi-select filters
   - Saved filter presets

5. **Notifications Panel**: Build a comprehensive notifications system:
   - In-app notification center
   - Email notification preferences
   - Push notifications

## Testing

To test the implementation:

1. Ensure the backend API is running at the configured URL
2. Have valid authentication tokens
3. Have test organizations and events in the database
4. Navigate to `/organizer` to view the dashboard

## Dependencies

- `zustand` - State management
- `lucide-react` - Icons
- `next` - Framework
- `react` - UI library
- Existing UI components from the design system

## Notes

- All components are client-side rendered using the `'use client'` directive
- Error boundaries should be added for production
- Loading states are handled at the component level
- Authentication state should be managed by a separate auth provider
- The layout automatically applies to all routes under `(organizer)/`
