# How to Find Your Creator V2 Drafts

## Quick Summary
Your creator v2 drafts are stored in the `event_creator_drafts` table in the database.

## Where to Look

### 1. Database Query (Direct)
```sql
-- See all drafts
SELECT
  id,
  title,
  status,
  completion_percent,
  active_section,
  organization_id,
  owner_user_id,
  updated_at,
  created_at
FROM event_creator_drafts
ORDER BY updated_at DESC;

-- See only drafts that appear on dashboard (draft or archived status)
SELECT
  id,
  title,
  status,
  completion_percent,
  active_section,
  updated_at
FROM event_creator_drafts
WHERE status IN ('draft', 'archived')
ORDER BY updated_at DESC;

-- Count drafts by organization
SELECT
  o.name as organization_name,
  COUNT(ecd.id) as draft_count
FROM event_creator_drafts ecd
JOIN organizations o ON o.id = ecd.organization_id
GROUP BY o.id, o.name
ORDER BY draft_count DESC;
```

### 2. Via API Endpoints

Once your backend is running, you can access drafts via these endpoints:

#### Get Dashboard Overview (includes drafts)
```bash
GET http://localhost:3000/organizer/dashboard?orgId={YOUR_ORG_ID}
Authorization: Bearer {YOUR_JWT_TOKEN}
```

Response will include:
```json
{
  "tasks": {
    "inProgressDrafts": [
      {
        "id": "...",
        "title": "...",
        "status": "draft",
        "completionPercent": 60,
        "activeSection": "tickets",
        ...
      }
    ]
  }
}
```

#### Get All Creator Drafts for Organization
```bash
GET http://localhost:3000/organizer/dashboard/creator-drafts?orgId={YOUR_ORG_ID}
Authorization: Bearer {YOUR_JWT_TOKEN}
```

#### Get User's Drafts (across all organizations)
```bash
GET http://localhost:3000/creator-v2/drafts
Authorization: Bearer {YOUR_JWT_TOKEN}
```

### 3. Via Frontend Dashboard

Once the frontend is running:
1. Navigate to `/organizer` (e.g., `http://localhost:4200/organizer` or whatever port your frontend uses)
2. Select your organization from the dropdown
3. Look for the **"In Progress Events"** section (appears above the tasks section)
4. You'll see all your drafts with:
   - Title
   - Completion percentage with color-coded progress bar
   - Current section being worked on
   - "Resume" button to continue editing
   - Delete button (with confirmation)

## How to Create a Draft (for Testing)

If you don't have any drafts yet:

1. **Start the backend**: `cd api && npm run start:dev`
2. **Start the frontend**: `cd frontend/web-app && npm run dev`
3. **Navigate to**: `http://localhost:3000/organizer/events/create`
4. **Start filling out the event form**
5. **Leave the page** (don't publish)
6. The draft will be auto-saved and visible on your dashboard

## Draft Statuses

The system tracks drafts with these statuses:

- **`draft`**: Actively being worked on (shows on dashboard)
- **`ready`**: Draft is ready but not yet published
- **`archived`**: Old/archived drafts (shows on dashboard)
- **`scheduled`**: Event scheduled for future publish (hidden from dashboard)
- **`published`**: Event was successfully published (hidden from dashboard)

## Troubleshooting

### "I don't see any drafts on my dashboard"

This could mean:
1. No drafts exist yet (create one by starting event creation)
2. All drafts have been published (status = 'published')
3. Frontend not connected to backend properly
4. Dashboard API not returning drafts

### How to verify drafts exist:

**Option 1: Check database directly**
```bash
# Connect to your PostgreSQL database
psql -U your_username -d your_database_name

# Run query
SELECT COUNT(*) FROM event_creator_drafts WHERE status IN ('draft', 'archived');
```

**Option 2: Use API directly**
```bash
# Get a JWT token first by logging in
TOKEN="your_jwt_token_here"

# Get your organization ID
ORG_ID="your_org_id_here"

# Query the API
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/organizer/dashboard/creator-drafts?orgId=$ORG_ID"
```

## Implementation Details

The new implementation:
- Queries `event_creator_drafts` table in the dashboard service
- Filters by status: `draft` or `archived`
- Orders by `updated_at` DESC (most recent first)
- Returns up to 10 drafts on dashboard overview
- Returns all drafts via dedicated endpoint
- Includes owner information for permission checking

## File Locations

- **Database Schema**: `api/prisma/schema.prisma` (line 1378)
- **Backend Service**: `api/src/organizer/organizer-dashboard.service.ts`
- **Backend Controller**: `api/src/organizer/dashboard.controller.ts`
- **Frontend Component**: `frontend/web-app/components/organizer/dashboard/in-progress-events.tsx`
- **Frontend Types**: `frontend/web-app/lib/types/organizer.ts`
