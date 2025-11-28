# Creator V2 Draft Events Dashboard Integration

## Overview
This document describes the implementation of **In Progress Events** visibility on the organizer dashboard, allowing organizers to see and resume events they were creating using the Event Creator V2 wizard.

## Problem Statement
The system had two separate draft systems that were not integrated:

1. **Event Creator V2 Draft System** (`EventCreatorDraft` table):
   - Multi-step wizard for creating events
   - Stored in-progress events with sections, autosave, versions, etc.
   - **Not visible on the organizer dashboard**

2. **Regular Event Draft System** (Events with `status: draft`):
   - Simple events created via the old system
   - Stored in the `Event` table with `status: EventStatus.draft`
   - **Shown on the dashboard**

## Solution Implemented

### Backend Changes

#### 1. Updated Dashboard Service (`api/src/organizer/organizer-dashboard.service.ts`)

**Added imports:**
```typescript
import {
  EventCreatorDraftStatus,
  EventStatus,
  ModerationStatus,
  OrderStatus,
  OrgMemberRole,
  PayoutStatus,
} from '@prisma/client';
```

**Added query to fetch creator v2 drafts in `getOverview()`:**
```typescript
// Creator V2 in-progress drafts
this.prisma.eventCreatorDraft.findMany({
  where: {
    organizationId: orgId,
    status: {
      in: [
        EventCreatorDraftStatus.draft,
        EventCreatorDraftStatus.abandoned,
      ],
    },
  },
  select: {
    id: true,
    title: true,
    status: true,
    completionPercent: true,
    activeSection: true,
    lastAutosavedAt: true,
    updatedAt: true,
    createdAt: true,
    owner: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
  orderBy: {
    updatedAt: 'desc',
  },
  take: 10,
}),
```

**Updated response to include creator drafts:**
```typescript
const tasks = {
  drafts: draftEvents,
  inProgressDrafts: creatorDrafts, // NEW
  moderationAlerts,
  unsettledPayouts: {
    count: unsettledPayouts._count._all,
    amountCents: Number(unsettledPayouts._sum.amountCents || BigInt(0)),
  },
};
```

**Added new methods:**

1. `getCreatorDrafts(orgId: string, userId: string)` - Get all creator v2 drafts for an organization
2. `deleteCreatorDraft(draftId: string, orgId: string, userId: string)` - Delete a creator v2 draft
   - Only owner or org owner/manager can delete
   - Proper permission checks

#### 2. Updated Dashboard Controller (`api/src/organizer/dashboard.controller.ts`)

**Added new endpoints:**

```typescript
@Get('creator-drafts')
@ApiQuery({ name: 'orgId', required: true })
@ApiOperation({ summary: 'Get all creator v2 in-progress drafts for an organization' })
getCreatorDrafts(@CurrentUser() user: any, @Query('orgId') orgId: string) {
  return this.dashboardService.getCreatorDrafts(orgId, user.id);
}

@Delete('creator-drafts/:draftId')
@ApiQuery({ name: 'orgId', required: true })
@ApiOperation({ summary: 'Delete a creator v2 draft' })
deleteCreatorDraft(
  @CurrentUser() user: any,
  @Param('draftId') draftId: string,
  @Query('orgId') orgId: string,
) {
  return this.dashboardService.deleteCreatorDraft(draftId, orgId, user.id);
}
```

### Frontend Changes

#### 1. Updated Types (`frontend/web-app/lib/types/organizer.ts`)

**Added new type:**
```typescript
export interface CreatorDraftItem {
  id: string;
  title: string | null;
  status: 'draft' | 'published' | 'scheduled' | 'abandoned';
  completionPercent: number;
  activeSection: string | null;
  lastAutosavedAt: string | null;
  updatedAt: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}
```

**Updated DashboardTasks interface:**
```typescript
export interface DashboardTasks {
  drafts: DashboardEvent[];
  inProgressDrafts: CreatorDraftItem[]; // NEW
  moderationAlerts: number;
  unsettledPayouts: {
    count: number;
    amountCents: number;
  };
}
```

#### 2. Updated API Client (`frontend/web-app/lib/api/organizer-api.ts`)

**Added new methods to dashboard API:**
```typescript
dashboard: {
  getOverview: (orgId: string) => {
    return apiClient.get<DashboardOverviewResponse>('/organizer/dashboard', { orgId });
  },

  getCreatorDrafts: (orgId: string) => {
    return apiClient.get<CreatorDraftItem[]>('/organizer/dashboard/creator-drafts', { orgId });
  },

  deleteCreatorDraft: (draftId: string, orgId: string) => {
    return apiClient.delete(`/organizer/dashboard/creator-drafts/${draftId}`, { orgId });
  },
},
```

#### 3. Created InProgressEvents Component (`frontend/web-app/components/organizer/dashboard/in-progress-events.tsx`)

**Features:**
- Displays all creator v2 drafts for the organization
- Shows completion percentage with color-coded progress bar:
  - Green (≥80%): Nearly complete
  - Yellow (≥50%): In progress
  - Red (<50%): Just started
- Displays current section being worked on
- Shows last updated and autosave times
- "Resume" button to continue editing the draft
- Delete button with confirmation
- Abandoned draft indicator
- Link to create a new event

**Visual Design:**
- Card-based layout with border
- Hover effects for better UX
- Responsive layout
- Uses date-fns for relative time display

#### 4. Updated Dashboard Component (`frontend/web-app/components/organizer/dashboard/dashboard-content.tsx`)

**Changes:**
- Imported `InProgressEvents` component
- Refactored `loadDashboard` to be callable outside useEffect (for refresh after deletion)
- Added new section to display in-progress events above the tasks section
- Updated "Draft Events" label to "Draft Events (Legacy)" to distinguish from creator v2 drafts

**Integration:**
```typescript
{/* In Progress Events Section */}
{dashboard && dashboard.tasks.inProgressDrafts && dashboard.tasks.inProgressDrafts.length > 0 && (
  <div className="mb-8">
    <InProgressEvents
      drafts={dashboard.tasks.inProgressDrafts}
      orgId={currentOrganization.id}
      onDraftDeleted={loadDashboard}
    />
  </div>
)}
```

## API Endpoints

### GET `/organizer/dashboard?orgId={id}`
**Description:** Get dashboard overview including creator v2 drafts
**Response includes:**
```typescript
{
  organization: {...},
  metrics: {...},
  upcomingEvents: [...],
  recentOrders: [...],
  recentVenues: [...],
  tasks: {
    drafts: [...],           // Legacy drafts
    inProgressDrafts: [...], // Creator V2 drafts (NEW)
    moderationAlerts: 0,
    unsettledPayouts: {...}
  }
}
```

### GET `/organizer/dashboard/creator-drafts?orgId={id}`
**Description:** Get all creator v2 in-progress drafts
**Returns:** Array of `CreatorDraftItem`

### DELETE `/organizer/dashboard/creator-drafts/:draftId?orgId={id}`
**Description:** Delete a creator v2 draft
**Authorization:** Only draft owner or org owner/manager
**Returns:** Success/error

## User Experience Flow

1. **Organizer starts creating an event** using Creator V2 wizard
2. **Organizer leaves mid-creation** (abandons or navigates away)
3. **Draft is auto-saved** with current section and completion percentage
4. **Organizer returns to dashboard**
5. **"In Progress Events" section appears** showing all incomplete drafts
6. **Organizer can:**
   - See completion percentage and current section
   - Click "Resume" to continue where they left off
   - Delete abandoned drafts they no longer want

## Benefits

1. **Improved Discoverability:** Organizers can easily find and resume incomplete events
2. **Better UX:** Visual progress indicators help prioritize which drafts to complete
3. **Cleanup:** Ability to delete abandoned drafts keeps the workspace tidy
4. **Transparency:** Clear distinction between legacy drafts and creator v2 drafts
5. **Encouragement:** Seeing in-progress events motivates users to complete them

## Technical Notes

### Permission Model
- Dashboard overview: Requires org membership (owner or manager role)
- Delete draft: Requires being draft owner OR org owner/manager

### Performance Considerations
- Limited to 10 most recent drafts in dashboard overview
- Full list available via dedicated endpoint
- Indexed queries on `organizationId`, `status`, and `updatedAt`

### Future Enhancements
1. Add filtering by completion percentage or status
2. Bulk delete abandoned drafts
3. Convert legacy drafts to creator v2 drafts
4. Add "Duplicate" feature directly from dashboard
5. Send notifications for long-abandoned drafts

## Files Modified

### Backend
- `api/src/organizer/organizer-dashboard.service.ts` - Added creator draft queries and methods
- `api/src/organizer/dashboard.controller.ts` - Added new endpoints

### Frontend
- `frontend/web-app/lib/types/organizer.ts` - Added CreatorDraftItem type
- `frontend/web-app/lib/api/organizer-api.ts` - Added API methods
- `frontend/web-app/components/organizer/dashboard/in-progress-events.tsx` - New component (created)
- `frontend/web-app/components/organizer/dashboard/dashboard-content.tsx` - Integrated component

## Testing Checklist

- [ ] Verify drafts appear on dashboard after starting creator v2
- [ ] Test "Resume" button navigates to correct draft ID
- [ ] Test delete functionality with permission checks
- [ ] Verify completion percentage displays correctly
- [ ] Test with no in-progress drafts (component hidden)
- [ ] Test with multiple drafts (sorting by updatedAt)
- [ ] Verify abandoned drafts show indicator
- [ ] Test dashboard refresh after deletion

## Conclusion

This implementation successfully bridges the gap between the Event Creator V2 wizard and the organizer dashboard, providing organizers with complete visibility into their event creation workflow. The solution is scalable, performant, and provides a solid foundation for future enhancements.
