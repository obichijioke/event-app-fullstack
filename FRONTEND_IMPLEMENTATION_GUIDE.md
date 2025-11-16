# Frontend Implementation Guide

## High-Priority Admin Features - Frontend Components

This guide provides implementation patterns for the three high-priority admin features. All backend APIs are complete and ready for integration.

---

## 1. Disputes Management Component

**Location**: `frontend/web-app/components/admin/disputes/dispute-list.tsx`

**Key Features**:
- Table with columns: Case ID, Order ID, Amount, Status, Provider, Buyer, Event, Opened Date
- Inline status badges with color coding
- Quick action buttons per row: View Details, Update Status, Respond, Close
- Filters: Status, Provider, Date Range, Search
- Dialog for updating status (inline modal)
- Dialog for responding to disputes
- Stats cards at top: Total, Needs Response, Win Rate

**API Endpoints to Use**:
```typescript
GET /admin/disputes?page=1&limit=10&status=needs_response
GET /admin/disputes/stats
GET /admin/disputes/:id
PATCH /admin/disputes/:id/status
POST /admin/disputes/:id/respond
POST /admin/disputes/:id/close
```

**Component Pattern**:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
// ... other imports

export function DisputeList() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Fetch data
  // Render table with inline actions
  // Status update dialog
  // Respond dialog
}
```

---

## 2. Fee Schedules Management Component

**Location**: `frontend/web-app/components/admin/fee-schedules/fee-schedule-manager.tsx`

**Key Features**:
- Two tabs: "Fee Schedules" and "Organization Overrides"
- Fee Schedules table: Name, Kind (Platform/Processing), Percent, Fixed Fee, Currency, Active
- Inline editing for active/inactive toggle
- Quick actions: Edit (dialog), Delete, Deactivate
- Create button opens dialog with form
- Organization overrides section shows which orgs have custom fees

**API Endpoints to Use**:
```typescript
GET /admin/fee-schedules?page=1&limit=10
GET /admin/fee-schedules/stats
POST /admin/fee-schedules
PATCH /admin/fee-schedules/:id
DELETE /admin/fee-schedules/:id
POST /admin/fee-schedules/:id/deactivate

// Overrides
POST /admin/fee-schedules/overrides
GET /admin/fee-schedules/overrides/organization/:orgId
PATCH /admin/fee-schedules/overrides/:id
DELETE /admin/fee-schedules/overrides/:id
```

**Component Structure**:
- Main list component with tabs
- Create/Edit dialog with validation
- Inline toggle for active status
- Override management dialog

---

## 3. Tax Rates Management Component

**Location**: `frontend/web-app/components/admin/tax-rates/tax-rate-manager.tsx`

**Key Features**:
- Table with inline editing capability
- Columns: Country, Region, City, Postal, Rate (%), Name, Active
- Grouping by country with expand/collapse
- Inline row editing (click row to edit)
- Quick create with preset templates (US States, EU VAT, etc.)
- Active toggle in each row
- Delete button with confirmation

**API Endpoints to Use**:
```typescript
GET /admin/tax-rates?page=1&limit=50&country=US
GET /admin/tax-rates/stats
GET /admin/tax-rates/country/:country
POST /admin/tax-rates
PATCH /admin/tax-rates/:id
DELETE /admin/tax-rates/:id
POST /admin/tax-rates/:id/deactivate
```

**Component Features**:
- Inline row editing
- Country grouping
- Validation: duplicate location check, rate 0-100%
- Templates for common jurisdictions

---

## Common Patterns for All Components

### 1. No SEO Metadata
```tsx
// Remove or comment out metadata exports - not needed for admin pages
// export const metadata = { ... }
```

### 2. Use Dialogs Instead of New Pages
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Dialog for actions instead of navigation
<Dialog open={showDialog} onOpenChange={setShowDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Update Status</DialogTitle>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>
```

### 3. Table with Inline Actions
```tsx
<table className="w-full">
  <thead>...</thead>
  <tbody>
    {items.map((item) => (
      <tr key={item.id}>
        <td>{item.name}</td>
        <td>
          <Button size="sm" onClick={() => handleAction(item)}>
            Action
          </Button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### 4. Filters in Header
```tsx
<div className="flex gap-4 mb-6">
  <select onChange={(e) => setFilters({...filters, status: e.target.value})}>
    <option value="">All Statuses</option>
    {/* ... */}
  </select>
  <input
    type="search"
    placeholder="Search..."
    onChange={(e) => setFilters({...filters, search: e.target.value})}
  />
</div>
```

### 5. Stats Cards
```tsx
<div className="grid grid-cols-4 gap-4 mb-6">
  <div className="bg-card p-4 rounded-lg border">
    <p className="text-sm text-muted-foreground">Total</p>
    <p className="text-2xl font-bold">{stats.total}</p>
  </div>
  {/* More cards */}
</div>
```

---

## API Service Setup

**Location**: `frontend/web-app/services/admin-api.service.ts`

Add these methods:

```typescript
// Disputes
export async function getDisputes(params: DisputeQueryParams) {
  return apiClient.get('/admin/disputes', { params });
}

export async function getDisputeStats() {
  return apiClient.get('/admin/disputes/stats');
}

export async function updateDisputeStatus(id: string, data: UpdateStatusDto) {
  return apiClient.patch(`/admin/disputes/${id}/status`, data);
}

// Fee Schedules
export async function getFeeSchedules(params: FeeScheduleQueryParams) {
  return apiClient.get('/admin/fee-schedules', { params });
}

export async function createFeeSchedule(data: CreateFeeScheduleDto) {
  return apiClient.post('/admin/fee-schedules', data);
}

// Tax Rates
export async function getTaxRates(params: TaxRateQueryParams) {
  return apiClient.get('/admin/tax-rates', { params });
}

export async function createTaxRate(data: CreateTaxRateDto) {
  return apiClient.post('/admin/tax-rates', data);
}
```

---

## TypeScript Types

**Location**: `frontend/web-app/types/admin.ts`

```typescript
export interface Dispute {
  id: string;
  orderId: string;
  provider: string;
  caseId: string;
  status: 'needs_response' | 'under_review' | 'won' | 'lost' | 'warning' | 'charge_refunded';
  amountCents: number;
  reason?: string;
  openedAt: string;
  closedAt?: string;
  buyerName: string;
  buyerEmail: string;
  eventTitle: string;
}

export interface FeeSchedule {
  id: string;
  kind: 'platform' | 'processing';
  name: string;
  percent: number;
  fixedCents: number;
  currency?: string;
  active: boolean;
  createdAt: string;
}

export interface TaxRate {
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
```

---

## Page Updates

Update the three stub pages to use the new components:

**`app/(admin)/admin/disputes/page.tsx`**:
```tsx
import { DisputeList } from '@/components/admin/disputes';

export default function DisputeManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DisputeList />
    </div>
  );
}
```

**`app/(admin)/admin/fee-schedules/page.tsx`**:
```tsx
import { FeeScheduleManager } from '@/components/admin/fee-schedules';

export default function FeeManagementPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FeeScheduleManager />
    </div>
  );
}
```

**`app/(admin)/admin/tax-rates/page.tsx`**:
```tsx
import { TaxRateManager } from '@/components/admin/tax-rates';

export default function TaxConfigurationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TaxRateManager />
    </div>
  );
}
```

---

## Implementation Checklist

### Disputes Management
- [ ] Create `dispute-list.tsx` component
- [ ] Add stats cards (total, needs_response, win_rate)
- [ ] Create table with status badges
- [ ] Add status update dialog
- [ ] Add respond to dispute dialog
- [ ] Add close dispute dialog
- [ ] Implement filters (status, provider, date range)
- [ ] Add pagination
- [ ] Update page to use component

### Fee Schedules Management
- [ ] Create `fee-schedule-manager.tsx` component
- [ ] Create two tabs: Schedules & Overrides
- [ ] Add fee schedule table
- [ ] Create create/edit dialog
- [ ] Add inline active toggle
- [ ] Add delete confirmation
- [ ] Add org override management
- [ ] Update page to use component

### Tax Rates Management
- [ ] Create `tax-rate-manager.tsx` component
- [ ] Add country-grouped table
- [ ] Implement inline row editing
- [ ] Add create dialog with templates
- [ ] Add inline active toggle
- [ ] Add delete confirmation
- [ ] Implement duplicate location validation
- [ ] Update page to use component

### API Integration
- [ ] Add dispute methods to admin-api.service.ts
- [ ] Add fee schedule methods to admin-api.service.ts
- [ ] Add tax rate methods to admin-api.service.ts
- [ ] Create TypeScript types for all entities
- [ ] Add error handling and loading states
- [ ] Add success/error toast notifications

---

## Backend API Summary

All backend endpoints are implemented and ready:

### Disputes (6 endpoints)
- GET `/admin/disputes` - List with filters
- GET `/admin/disputes/stats` - Statistics
- GET `/admin/disputes/:id` - Get details
- PATCH `/admin/disputes/:id/status` - Update status
- POST `/admin/disputes/:id/respond` - Respond
- POST `/admin/disputes/:id/close` - Close

### Fee Schedules (12 endpoints)
- GET `/admin/fee-schedules` - List
- GET `/admin/fee-schedules/stats` - Statistics
- GET `/admin/fee-schedules/:id` - Get details
- POST `/admin/fee-schedules` - Create
- PATCH `/admin/fee-schedules/:id` - Update
- DELETE `/admin/fee-schedules/:id` - Delete
- POST `/admin/fee-schedules/:id/deactivate` - Deactivate
- POST `/admin/fee-schedules/overrides` - Create override
- GET `/admin/fee-schedules/overrides/organization/:orgId` - Get org overrides
- PATCH `/admin/fee-schedules/overrides/:id` - Update override
- DELETE `/admin/fee-schedules/overrides/:id` - Delete override

### Tax Rates (8 endpoints)
- GET `/admin/tax-rates` - List
- GET `/admin/tax-rates/stats` - Statistics
- GET `/admin/tax-rates/country/:country` - By country
- GET `/admin/tax-rates/:id` - Get details
- POST `/admin/tax-rates` - Create
- PATCH `/admin/tax-rates/:id` - Update
- DELETE `/admin/tax-rates/:id` - Delete
- POST `/admin/tax-rates/:id/deactivate` - Deactivate

---

**Backend Status**: ✅ Complete - All services, DTOs, and endpoints implemented
**Frontend Status**: 📋 Guide provided - Ready for implementation using patterns above
