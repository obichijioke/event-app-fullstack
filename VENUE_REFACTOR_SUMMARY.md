# Venue-Based Seatmap Refactor Summary

## Overview
Refactored the seatmap system from organization-based to venue-based architecture, following industry best practices where venues own seatmaps and events select venues.

## ✅ Completed Changes

### 1. Database Schema (Prisma)

**Updated Models:**

```prisma
model Venue {
  id        String    @id @default(cuid())
  orgId     String    @map("org_id")
  name      String
  address   Json      // {line1, line2, city, region, postal, country}
  timezone  String
  capacity  Int?
  latitude  Decimal?
  longitude Decimal?
  createdAt DateTime  @default(now())
  deletedAt DateTime?

  // Relations
  org      Organization @relation(...)
  events   Event[]      // Events happen at venues
  seatmaps Seatmap[]    // ← NEW: Venues have seatmaps
}

model Seatmap {
  id          String   @id @default(cuid())
  venueId     String   @map("venue_id")  // ← CHANGED: From orgId to venueId
  name        String
  description String?                     // ← NEW: Optional description
  spec        Json
  isDefault   Boolean  @default(false)   // ← NEW: Mark default seatmap
  createdAt   DateTime @default(now())

  // Relations
  venue         Venue          @relation(...) // ← CHANGED: From org to venue
  seats         Seat[]
  events        Event[]
  eventSeatmaps EventSeatmap[]
}

model Event {
  // ... existing fields
  venueId   String?   // ← Already existed
  seatmapId String?   // ← Already existed (optional override)

  venue   Venue?   @relation(...)
  seatmap Seatmap? @relation(...)
}
```

**Key Changes:**
- ✅ Added `seatmaps` relation to Venue model
- ✅ Changed Seatmap.orgId → Seatmap.venueId
- ✅ Added Seatmap.description field
- ✅ Added Seatmap.isDefault flag
- ✅ Removed seatmaps relation from Organization model
- ✅ Event model already had venueId and seatmapId (no changes needed)

**Migration:**
- ✅ Ran `npx prisma db push` successfully
- ✅ Prisma Client regenerated

### 2. Backend DTOs

**Created:**
- ✅ `src/organizer/dto/create-venue.dto.ts`
  - CreateVenueDto
  - UpdateVenueDto
  - AddressDto

**Updated:**
- ✅ `src/seatmaps/dto/create-seatmap.dto.ts`
  - Added `description?: string`
  - Added `isDefault?: boolean`

## 🚧 In Progress / Pending

### 3. Backend Services & Controllers

**Need to Create:**
- ⏳ Venue Service (`src/organizer/venues.service.ts`)
  - create(orgId, userId, dto)
  - findAll(userId) - Get all venues for user's orgs
  - findOne(id, userId)
  - update(id, userId, dto)
  - delete(id, userId)
  - findByOrg(orgId, userId)

- ⏳ Venue Controller (`src/organizer/venues.controller.ts`)
  - POST /organizer/venues
  - GET /organizer/venues
  - GET /organizer/venues/:id
  - PATCH /organizer/venues/:id
  - DELETE /organizer/venues/:id

**Need to Update:**
- ⏳ Seatmaps Service (`src/seatmaps/seatmaps.service.ts`)
  - Change createForOrg → createForVenue
  - Update queries to use venueId instead of orgId
  - Add logic for isDefault flag

- ⏳ Seatmaps Controller (`src/seatmaps/seatmaps.controller.ts`)
  - Change POST /seatmaps/org/:orgId → POST /seatmaps/venue/:venueId
  - Update findAll to query by venues the user has access to

- ⏳ Events Service
  - Update event creation to validate venueId
  - Auto-assign venue's default seatmap if seatmapId not provided

### 4. Frontend Types & API Client

**Need to Create:**
- ⏳ `frontend/web-app/lib/types/venue.ts`
  ```typescript
  export interface Venue {
    id: string;
    orgId: string;
    name: string;
    address: Address;
    timezone: string;
    capacity?: number;
    latitude?: number;
    longitude?: number;
    createdAt: string;
  }

  export interface Address {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  }

  export interface CreateVenueDto {
    name: string;
    address: Address;
    timezone: string;
    capacity?: number;
    latitude?: number;
    longitude?: number;
  }
  ```

- ⏳ `frontend/web-app/lib/api/venues-api.ts`
  ```typescript
  export const venuesApi = {
    list: () => axios.get('/organizer/venues'),
    get: (id: string) => axios.get(`/organizer/venues/${id}`),
    create: (orgId: string, data: CreateVenueDto) =>
      axios.post('/organizer/venues', { ...data, orgId }),
    update: (id: string, data: Partial<CreateVenueDto>) =>
      axios.patch(`/organizer/venues/${id}`, data),
    delete: (id: string) => axios.delete(`/organizer/venues/${id}`),
  };
  ```

**Need to Update:**
- ⏳ `frontend/web-app/lib/types/organizer.ts`
  - Update Seatmap interface to include venueId, description, isDefault
  - Update CreateSeatmapDto

- ⏳ `frontend/web-app/lib/api/seatmaps-api.ts`
  - Change createSeatmap(orgId, dto) → createSeatmap(venueId, dto)

### 5. Frontend UI Components

**Need to Create:**
- ⏳ Venue Management Pages:
  - `/organizer/venues/page.tsx` - List all venues
  - `/organizer/venues/create/page.tsx` - Create venue form
  - `/organizer/venues/[venueId]/page.tsx` - Venue details
  - `/organizer/venues/[venueId]/edit/page.tsx` - Edit venue
  - `/organizer/venues/[venueId]/seatmaps/page.tsx` - Manage venue seatmaps

- ⏳ Venue Components:
  - `components/organizer/venues/venue-list.tsx`
  - `components/organizer/venues/venue-form.tsx`
  - `components/organizer/venues/venue-card.tsx`
  - `components/organizer/venues/venue-seatmaps.tsx`

**Need to Update:**
- ⏳ Seatmap Components:
  - Update `components/organizer/seatmaps/seatmap-list.tsx`
    - Show venues instead of organizations
    - Filter by venue
  - Update `components/organizer/seatmaps/create-seatmap-form.tsx`
    - Select venue first
    - Then create seatmap for that venue
  - Update `components/organizer/seatmaps/edit-seatmap-form.tsx`
    - Show venue info
    - Add description field
    - Add "Set as default" checkbox

- ⏳ Event Components:
  - Update event creation form to select venue first
  - Auto-suggest venue's default seatmap
  - Allow override with custom seatmap from same venue

### 6. Updated Workflow

**New User Flow:**

```
1. Create Venue
   Organizer → /organizer/venues/create
   - Name: "Madison Square Garden"
   - Address: Full address with lat/long
   - Timezone: "America/New_York"
   - Capacity: 20,000

2. Create Seatmap(s) for Venue
   Organizer → /organizer/venues/:venueId/seatmaps/create
   - Seatmap Name: "Concert Configuration"
   - Canvas Editor: Design 20k seats
   - Mark as Default: ✓
   - Save

   Organizer → /organizer/venues/:venueId/seatmaps/create
   - Seatmap Name: "Basketball Configuration"
   - Canvas Editor: Different layout (15k seats)
   - Save

3. Create Event
   Organizer → /organizer/events/create
   - Title: "Taylor Swift Concert"
   - Select Venue: "Madison Square Garden" (dropdown)
   - Seatmap: Auto-filled with "Concert Configuration" (default)
   - Can override to "Basketball Configuration" if needed
```

## Benefits of Refactor

✅ **Reusability**: Create seatmap once, use for all events at that venue
✅ **Consistency**: Same venue = same seat numbers across all events
✅ **Less work**: Don't recreate layouts for recurring events
✅ **Venue management**: Proper venue entity with full details
✅ **Multiple configs**: One venue can have different layouts
✅ **Better UX**: Venues as first-class entities
✅ **Industry standard**: Matches Ticketmaster/Eventbrite approach

## Migration Strategy

For existing data (if needed):
1. Create a migration script to:
   - Extract unique venue names from events
   - Create Venue records for each
   - Move existing seatmaps to venues (based on organization)
   - Update event references

## Next Steps

1. **Backend**: Create venue service and controller
2. **Backend**: Update seatmaps service to use venueId
3. **Frontend**: Create venue types and API client
4. **Frontend**: Build venue management UI
5. **Frontend**: Update seatmap UI to be venue-based
6. **Frontend**: Update event creation to select venues
7. **Testing**: End-to-end testing of new workflow

## Files Changed

### Backend
- ✅ `api/prisma/schema.prisma` - Updated Venue, Seatmap, removed org->seatmap relation
- ✅ `api/src/organizer/dto/create-venue.dto.ts` - Created
- ✅ `api/src/seatmaps/dto/create-seatmap.dto.ts` - Updated

### Frontend
- (Pending - to be updated after backend is complete)

## Documentation

See also:
- `SEATMAP_IMPLEMENTATION_PLAN.md` - Original seatmap design
- `IMPLEMENTATION_SUMMARY.md` - Check-in & Holds implementation
- `TODO.md` - Overall project status
