# Auto Organization Selection Implementation

## Overview

The organizer dashboard now automatically loads and selects the user's organizations when they access the dashboard, eliminating the need for manual organization selection.

## Implementation Details

### 1. Organization Provider

**File**: [components/organizer/organization-provider.tsx](components/organizer/organization-provider.tsx)

**Purpose**: Automatically fetches the user's organizations when the organizer dashboard is accessed.

**Features**:
- Fetches organizations via `organizerApi.getMyOrganizations()`
- Shows loading spinner during initial fetch
- Handles error states with retry button
- Shows "No Organizations" state with create link
- Development fallback with mock data if API fails
- Only loads once per session (checks if already loaded)

**States**:
- **Loading**: Shows spinner with "Loading your organizations..." message
- **Error**: Shows error message with retry button
- **No Organizations**: Shows empty state with "Create Organization" link
- **Success**: Renders children (dashboard content)

### 2. Zustand Store Enhancement

**File**: [lib/stores/organizer-store.ts](lib/stores/organizer-store.ts)

**Auto-Selection Logic**:
```typescript
setOrganizations: (orgs) => {
  set({ organizations: orgs });
  // If no current organization is set, set the first one
  set((state) => {
    if (!state.currentOrganization && orgs.length > 0) {
      return { currentOrganization: orgs[0] };
    }
    return {};
  });
}
```

**Behavior**:
- When organizations are loaded, automatically selects the first one
- Only auto-selects if no organization is currently selected
- Preserves user's selection if they've already chosen an organization
- Persists selection in localStorage

### 3. API Integration

**File**: [lib/api/organizer-api.ts](lib/api/organizer-api.ts)

**New Function**:
```typescript
getMyOrganizations: () => {
  return apiClient.get<DashboardOrganization[]>('/organizations/my-memberships');
}
```

**Endpoint**: `GET /organizations/my-memberships`

**Returns**: Array of organizations the user is a member of

### 4. Layout Integration

**File**: [components/organizer/layout/organizer-layout.tsx](components/organizer/layout/organizer-layout.tsx)

**Change**: Wrapped layout with `OrganizationProvider`

```typescript
export function OrganizerLayout({ children }: OrganizerLayoutProps) {
  return (
    <OrganizationProvider>
      <div className="min-h-screen bg-background">
        <OrganizerHeader />
        <div className="flex">
          <OrganizerSidebar />
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </OrganizationProvider>
  );
}
```

## User Flow

### First Visit
1. User navigates to `/organizer`
2. `OrganizationProvider` checks if organizations are loaded
3. If not, fetches from API: `GET /organizations/my-memberships`
4. Shows loading spinner during fetch
5. On success:
   - Stores organizations in Zustand store
   - Automatically selects first organization
   - Persists to localStorage
   - Renders dashboard

### Subsequent Visits
1. User navigates to `/organizer`
2. `OrganizationProvider` checks if organizations are loaded
3. Finds organizations in localStorage (from Zustand persist)
4. Skips API call
5. Immediately renders dashboard with selected organization

### Organization Switching
1. User clicks organization selector in header
2. Selects different organization
3. Selection saved to Zustand store
4. Persisted to localStorage
5. All dashboard pages automatically use new organization

## Development Mode

In development, if the API call fails, the provider automatically falls back to mock data:

```typescript
{
  id: 'org_demo',
  name: 'Demo Organization',
  status: 'approved',
  role: 'owner',
}
```

This allows frontend development without a running backend.

## Error Handling

### API Failure (Production)
- Shows error message: "Failed to Load Organizations"
- Displays error details
- Provides "Retry" button to reload

### No Organizations
- Shows message: "No Organizations Found"
- Explains: "You need to be a member of an organization to access the organizer dashboard"
- Provides "Create Organization" link

### Network Issues
- Gracefully handles timeout/network errors
- Shows user-friendly error messages
- Allows retry without page refresh

## Benefits

### For Users
- No manual organization selection required
- Instant access to dashboard
- Seamless experience
- Selection remembered across sessions

### For Developers
- Clean separation of concerns
- Centralized organization loading
- Easy to test with mock data
- Type-safe implementation

## Testing

### Manual Testing Checklist
- [ ] First visit loads organizations
- [ ] Loading spinner displays
- [ ] First organization auto-selected
- [ ] Dashboard shows correct org data
- [ ] Organization selector shows all orgs
- [ ] Switching orgs updates dashboard
- [ ] Refresh maintains selection
- [ ] Error state shows on API failure
- [ ] Retry button works
- [ ] No orgs state shows correct message
- [ ] Development fallback works

### Edge Cases Handled
- User has no organizations
- API returns empty array
- API fails/times out
- User has multiple organizations
- User refreshes page
- User switches organizations
- localStorage is cleared
- Network is offline

## Future Enhancements

1. **Recent Organizations**: Track recently used organizations and show them first
2. **Organization Search**: For users with many organizations
3. **Favorites**: Allow users to favorite/pin organizations
4. **Organization Invites**: Handle pending invitations
5. **Role-Based Defaults**: Default to organizations where user is owner/manager
6. **Multi-Select**: Allow managing multiple organizations simultaneously
7. **Organization Sync**: Periodic background sync for organization updates

## Files Modified/Created

### Created
- `components/organizer/organization-provider.tsx` - Provider component

### Modified
- `components/organizer/layout/organizer-layout.tsx` - Added provider
- `lib/api/organizer-api.ts` - Added getMyOrganizations
- `lib/stores/organizer-store.ts` - Already had auto-select logic

## API Requirements

The backend must implement:

**Endpoint**: `GET /organizations/my-memberships`

**Headers**:
- `Authorization: Bearer <jwt>`

**Response**:
```json
[
  {
    "id": "org_123",
    "name": "Acme Events",
    "status": "approved",
    "role": "owner"
  },
  {
    "id": "org_456",
    "name": "Beta Productions",
    "status": "approved",
    "role": "manager"
  }
]
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized (not logged in)
- `500` - Server error
