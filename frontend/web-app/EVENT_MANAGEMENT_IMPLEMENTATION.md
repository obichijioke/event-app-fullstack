# Event Management Pages Implementation

This document details the implementation of Event Management pages for the Organizer Dashboard.

## Overview

Event Management provides organizers with comprehensive tools to create, view, edit, and manage their events with filtering, status management, and detailed analytics.

## Implemented Features

### 1. Event List Page (`/organizer/events`)

**Location**: [app/(organizer)/organizer/events/page.tsx](app/(organizer)/organizer/events/page.tsx)

**Features**:
- Grid view of all events (3 columns on desktop, responsive)
- Real-time filtering by:
  - Search (by event title)
  - Status (draft, pending, approved, live, paused, canceled, completed)
- Event count display
- Quick actions on each card (Edit, Tickets, Orders)
- Empty state with call-to-action
- Loading states with spinner
- Links to Creator v2 and Create Event

**Components Used**:
- `EventFilters` - Filter panel with search and status dropdown
- `EventCard` - Individual event card display
- `EmptyState` - No events message

### 2. Event Detail Page (`/organizer/events/[eventId]`)

**Location**: [app/(organizer)/organizer/events/[eventId]/page.tsx](app/(organizer)/organizer/events/[eventId]/page.tsx)

**Features**:
- Full event information display
- Status badge with color coding
- Key metrics:
  - Tickets Sold
  - Revenue
  - Orders Count
  - Checked In Count
- Event status action buttons (Publish, Pause, Cancel, Delete)
- Quick action grid with 8 actions:
  - Edit Event
  - Manage Tickets
  - View Orders
  - Attendees
  - Check-In
  - Promo Codes
  - Occurrences
  - Seatmap
- Event details section with:
  - Description (Markdown support)
  - Visibility status
  - Category
  - Door Time
  - Published Date
- Public page preview link
- Back to events list navigation

**Components Used**:
- `EventDetailContent` - Main detail view
- `EventStatusActions` - Status management buttons
- `MetricCard` - KPI display
- `StatCard` - Section wrapper

### 3. Event Edit Page (`/organizer/events/[eventId]/edit`)

**Location**: [app/(organizer)/organizer/events/[eventId]/edit/page.tsx](app/(organizer)/organizer/events/[eventId]/edit/page.tsx)

**Features**:
- Form to edit event details:
  - **Basic Information**:
    - Event Title (required)
    - Description (Markdown support)
    - Visibility (Public, Unlisted, Private)
    - Cover Image URL
  - **Date & Time**:
    - Start Date & Time (required)
    - End Date & Time
    - Door Time
- Form validation
- Loading state while fetching event data
- Save and Cancel buttons
- Success/error toast notifications
- Auto-redirect to event detail on save

**Components Used**:
- `EventEditForm` - Full edit form with state management
- Form uses native HTML inputs with Tailwind styling

### 4. Event Status Actions Component

**Location**: [components/organizer/events/event-status-actions.tsx](components/organizer/events/event-status-actions.tsx)

**Features**:
- Context-aware buttons based on current status:
  - **Publish**: Shows for draft, pending, approved, paused events
  - **Pause**: Shows for live events
  - **Cancel**: Shows for live, pending, approved events
  - **Delete**: Shows only for draft events
  - **Preview**: Always visible (opens public page)
- Confirmation dialogs for destructive actions
- Loading states during API calls
- Success/error notifications
- Automatic page refresh after status change

### 5. Event Filters Component

**Location**: [components/organizer/events/event-filters.tsx](components/organizer/events/event-filters.tsx)

**Features**:
- Search input with icon
- Status dropdown with all status options
- Clear all filters button (only shows when filters are active)
- Responsive 2-column grid layout
- Real-time filter application

### 6. Event Card Component

**Location**: [components/organizer/events/event-card.tsx](components/organizer/events/event-card.tsx)

**Features**:
- Event title and status badge
- Date/time display
- Venue information (if available)
- Category display (if available)
- Optional statistics (tickets sold, revenue)
- Quick action links in footer
- Hover effects
- Clickable to view detail page

## Component Hierarchy

```
Event List Page
â”œâ”€â”€ EventFilters
â”‚   â”œâ”€â”€ Search Input
â”‚   â””â”€â”€ Status Dropdown
â””â”€â”€ EventCard (multiple)
    â”œâ”€â”€ Event Info
    â”œâ”€â”€ Stats (optional)
    â””â”€â”€ Quick Actions

Event Detail Page
â”œâ”€â”€ EventStatusActions
â”‚   â”œâ”€â”€ Publish Button
â”‚   â”œâ”€â”€ Pause Button
â”‚   â”œâ”€â”€ Cancel Button
â”‚   â”œâ”€â”€ Delete Button
â”‚   â””â”€â”€ Preview Link
â”œâ”€â”€ MetricCard (x4)
â”‚   â”œâ”€â”€ Tickets Sold
â”‚   â”œâ”€â”€ Revenue
â”‚   â”œâ”€â”€ Orders
â”‚   â””â”€â”€ Checked In
â”œâ”€â”€ Quick Actions Grid
â”‚   â””â”€â”€ 8 Action Links
â””â”€â”€ Event Information
    â”œâ”€â”€ Description
    â””â”€â”€ Event Details

Event Edit Page
â””â”€â”€ EventEditForm
    â”œâ”€â”€ Basic Information Section
    â”œâ”€â”€ Date & Time Section
    â””â”€â”€ Action Buttons
```

## API Integration

All pages integrate with the `organizerApi` from [lib/api/organizer-api.ts](lib/api/organizer-api.ts):

### Event List
```typescript
organizerApi.events.list({
  orgId: string,
  search?: string,
  status?: EventStatus,
});
```

### Event Detail
```typescript
organizerApi.events.get(eventId: string, orgId: string);
```

### Event Update
```typescript
organizerApi.events.update(
  eventId: string,
  data: UpdateEventDto,
  orgId: string
);
```

### Status Actions
```typescript
organizerApi.events.publish(eventId: string, orgId: string);
organizerApi.events.pause(eventId: string, orgId: string);
organizerApi.events.cancel(eventId: string, orgId: string);
organizerApi.events.delete(eventId: string, orgId: string);
```

## State Management

Uses `useOrganizerStore` from Zustand for:
- Current organization selection
- Organization context for API calls
- Persistent state across navigation

## User Experience Features

### Loading States
- Skeleton loaders on dashboard
- Spinner on list/detail pages
- Button loading states during saves
- Disabled states during operations

### Error Handling
- Empty states for no data
- Error messages with friendly text
- Toast notifications for success/failure
- Validation errors on forms

### Responsive Design
- Mobile-first approach
- Grid layouts adapt to screen size
- Touch-friendly buttons
- Readable text at all sizes

### Navigation
- Breadcrumb-style back buttons
- Quick action links
- Consistent routing
- Auto-redirects after operations

## Status Color Coding

All status displays use consistent color scheme:

```typescript
draft: gray (bg-gray-100 text-gray-800 border-gray-200)
pending: yellow (bg-yellow-100 text-yellow-800 border-yellow-200)
approved: blue (bg-blue-100 text-blue-800 border-blue-200)
live: green (bg-green-100 text-green-800 border-green-200)
paused: orange (bg-orange-100 text-orange-800 border-orange-200)
canceled: red (bg-red-100 text-red-800 border-red-200)
completed: purple (bg-purple-100 text-purple-800 border-purple-200)
```

## Form Validation

Event Edit Form validation:
- Title: Required field
- Start Date: Required field
- URLs: Valid URL format
- Dates: Datetime-local input type
- All other fields: Optional

## Future Enhancements

Potential additions for future iterations:

1. **Bulk Actions**: Select multiple events for batch operations
2. **Advanced Filters**: Date range, category, venue filters
3. **Sorting**: Sort by date, title, status, revenue
4. **Pagination**: Handle large event lists efficiently
5. **Duplicate Event**: Clone existing event as template
6. **Draft Auto-save**: Prevent data loss during editing
7. **Image Upload**: Direct image upload instead of URL
8. **Rich Text Editor**: Enhanced description editing
9. **Event Templates**: Reusable event configurations
10. **Bulk Edit**: Edit multiple events simultaneously

## Testing Checklist

- [ ] Event list loads with correct data
- [ ] Filters work correctly
- [ ] Search filters events in real-time
- [ ] Status filter updates event list
- [ ] Event card displays all information
- [ ] Quick actions navigate correctly
- [ ] Event detail shows complete information
- [ ] Metrics display accurate data
- [ ] Status actions work for appropriate statuses
- [ ] Publish confirmation works
- [ ] Pause confirmation works
- [ ] Cancel confirmation works
- [ ] Delete confirmation works
- [ ] Preview opens public page
- [ ] Edit form loads current data
- [ ] Form validation works
- [ ] Save updates event successfully
- [ ] Cancel returns without saving
- [ ] Toast notifications appear
- [ ] Loading states display
- [ ] Error states handled gracefully
- [ ] Mobile responsive layout works
- [ ] Organization selector works

## Files Created/Modified

### New Components
- `components/organizer/events/event-filters.tsx`
- `components/organizer/events/event-card.tsx`
- `components/organizer/events/event-status-actions.tsx`
- `components/organizer/events/event-detail-content.tsx`
- `components/organizer/events/event-edit-form.tsx`

### Modified Pages
- `app/(organizer)/organizer/events/page.tsx` - Event list
- `app/(organizer)/organizer/events/[eventId]/page.tsx` - Event detail
- `app/(organizer)/organizer/events/[eventId]/edit/page.tsx` - Event edit

All pages now feature complete functionality with proper error handling, loading states, and user feedback.

