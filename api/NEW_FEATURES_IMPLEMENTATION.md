# New Features Implementation Summary

This document summarizes the implementation of two major features added to the Event Management API:

1. **Location-Based Event Discovery (Geolocation)**
2. **User Following System**

## Feature 1: Location-Based Event Discovery

### Overview
Enables users to discover events based on their geographic location using latitude and longitude coordinates.

### Database Schema Changes

#### Venues Table
Added geolocation fields to the `venues` table:
- `latitude` (DECIMAL(10,8)) - Latitude coordinate (-90 to 90)
- `longitude` (DECIMAL(11,8)) - Longitude coordinate (-180 to 180)
- Added composite index on `[latitude, longitude]` for efficient spatial queries

#### Events Table
Added optional geolocation fields to the `events` table:
- `latitude` (DECIMAL(10,8)) - For events without a specific venue
- `longitude` (DECIMAL(11,8)) - For events without a specific venue
- Added composite index on `[latitude, longitude]`

### API Endpoints

#### 1. Updated Venue Endpoints
**POST /venues** and **PATCH /venues/:id**
- Now accept optional `latitude` and `longitude` fields
- Validation: latitude (-90 to 90), longitude (-180 to 180)

#### 2. Updated Event Endpoints
**POST /events** and **PATCH /events/:id**
- Now accept optional `latitude` and `longitude` fields
- Used for events without a specific venue
- Validation: latitude (-90 to 90), longitude (-180 to 180)

#### 3. New Nearby Events Endpoint
**GET /events/nearby**

Query Parameters:
- `latitude` (required): User's current latitude
- `longitude` (required): User's current longitude
- `radius` (optional, default: 50): Search radius in kilometers (1-500)
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 20): Results per page (1-100)

Response:
```json
{
  "data": [
    {
      "id": "event_id",
      "title": "Event Title",
      "distance": 12.45,
      "coordinates": {
        "latitude": 6.5244,
        "longitude": 3.3792
      },
      "org": { "id": "org_id", "name": "Org Name" },
      "venue": { ... },
      ...
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

### Implementation Details

#### Distance Calculation
- Uses **Haversine formula** for accurate distance calculation
- Returns distance in kilometers rounded to 2 decimal places
- Filters events within the specified radius
- Sorts results by distance (closest first)

#### Coordinate Priority
For events, the system uses coordinates in this order:
1. Event's own latitude/longitude (if set)
2. Venue's latitude/longitude (if event has a venue)
3. Excluded if neither is available

### DTOs Created/Updated

1. **CreateVenueDto** - Added `latitude` and `longitude` fields
2. **UpdateVenueDto** - Inherits from CreateVenueDto (automatically includes new fields)
3. **CreateEventDto** - Added optional `latitude` and `longitude` fields
4. **UpdateEventDto** - Inherits from CreateEventDto
5. **NearbyEventsDto** - New DTO for nearby events query parameters

### Service Methods

**EventsService.findNearby()**
- Fetches all public live events with coordinates
- Calculates distance for each event
- Filters by radius
- Sorts by distance
- Implements pagination

---

## Feature 2: User Following System

### Overview
Allows users to follow organizations to receive updates about their events and stay connected with their favorite event organizers.

### Database Schema Changes

#### New Table: user_follows
```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_follows_user_id ON user_follows(user_id);
CREATE INDEX idx_user_follows_organization_id ON user_follows(organization_id);
```

#### Updated Models
- **User** model: Added `following` relation (UserFollow[])
- **Organization** model: Added `followers` relation (UserFollow[])

### API Endpoints

#### 1. Follow an Organization
**POST /organizations/:id/follow**

- Requires authentication
- Creates a follow relationship
- Returns follow record with ID, userId, organizationId, createdAt

Responses:
- `201`: Successfully followed
- `404`: Organization not found
- `409`: Already following this organization

#### 2. Unfollow an Organization
**DELETE /organizations/:id/follow**

- Requires authentication
- Removes follow relationship

Responses:
- `200`: Successfully unfollowed
- `404`: Not following this organization

#### 3. Get User's Following List
**GET /auth/me/following**

- Requires authentication
- Returns list of organizations the user follows
- Includes organization details (id, name, legalName, website, country, status)
- Sorted by follow date (most recent first)

Response:
```json
[
  {
    "id": "follow_id",
    "organizationId": "org_id",
    "organization": {
      "id": "org_id",
      "name": "Tech Events Nigeria",
      "legalName": "Tech Events Nigeria Ltd",
      "website": "https://techevents.ng",
      "country": "Nigeria",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "followedAt": "2024-01-20T15:30:00Z"
  }
]
```

#### 4. Get Organization Followers
**GET /organizations/:id/followers**

- Requires authentication
- Query parameter: `includeUsers=true` (optional) - Show full follower list

Responses:
- Without `includeUsers`: Returns `{ count: 150 }`
- With `includeUsers=true`: Returns full list with user details

```json
{
  "total": 150,
  "followers": [
    {
      "id": "follow_id",
      "userId": "user_id",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-20T15:30:00Z"
    }
  ]
}
```

#### 5. Filter Events by Followed Organizations
**GET /events?following=true**

- Requires authentication (user ID extracted from JWT)
- Returns only events from organizations the user follows
- Combines with other filters (status, category, upcoming, search)

### Service Methods

**UserFollowsService** provides:
- `follow(userId, organizationId)` - Create follow relationship
- `unfollow(userId, organizationId)` - Remove follow relationship
- `getFollowing(userId)` - Get user's following list
- `getFollowers(organizationId, includeUsers)` - Get organization followers
- `isFollowing(userId, organizationId)` - Check if user follows org
- `getFollowerCount(organizationId)` - Get follower count
- `getFollowerCounts(organizationIds[])` - Batch get counts
- `areFollowing(userId, organizationIds[])` - Batch check following status

### Enhanced Organization Response

**GET /organizations/:id** now includes:
- `followerCount`: Number of followers
- `isFollowing`: Boolean indicating if current user follows this organization

```json
{
  "id": "org_id",
  "name": "Tech Events Nigeria",
  ...
  "followerCount": 150,
  "isFollowing": true
}
```

---

## Migration Steps

### 1. Update Prisma Schema
The schema has been updated with:
- Geolocation fields for venues and events
- UserFollow model
- Proper indexes for performance

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Apply Database Migration
```bash
npx prisma db push
```

Or create a migration:
```bash
npx prisma migrate dev --name add_geolocation_and_following
```

---

## Testing Recommendations

### Geolocation Features
1. Create venues with coordinates
2. Create events with venue coordinates
3. Create events with their own coordinates
4. Test nearby search with different radii
5. Verify distance calculations
6. Test pagination

### Following Features
1. Follow an organization
2. Try to follow the same organization again (should fail with 409)
3. Unfollow an organization
4. Get following list
5. Get follower count
6. Filter events by followed organizations
7. Verify followerCount and isFollowing in organization response

---

## Next Steps

1. **Write Unit Tests** - Test services and controllers
2. **Update API Documentation** - Add new endpoints to API.md
3. **Update Frontend Integration Guide** - Add examples to FRONTEND_INTEGRATION.md
4. **Performance Optimization** - Consider PostGIS for advanced geospatial queries
5. **Notifications** - Implement email notifications for new events from followed organizations
6. **Webhooks** - Add webhook events for new followers

---

## Files Modified/Created

### Modified Files
- `api/prisma/schema.prisma` - Added geolocation fields and UserFollow model
- `api/src/venues/dto/create-venue.dto.ts` - Added latitude/longitude
- `api/src/events/dto/create-event.dto.ts` - Added latitude/longitude
- `api/src/events/events.service.ts` - Added findNearby() and updated findPublic()
- `api/src/events/events.controller.ts` - Added nearby endpoint, updated findPublic
- `api/src/organizations/organizations.service.ts` - Added follower data
- `api/src/organizations/organizations.controller.ts` - Added follow endpoints
- `api/src/organizations/organizations.module.ts` - Exported UserFollowsService
- `api/src/auth/auth.controller.ts` - Added GET /auth/me/following
- `api/src/auth/auth.module.ts` - Imported OrganizationsModule

### Created Files
- `api/src/events/dto/nearby-events.dto.ts` - DTO for nearby events query
- `api/src/organizations/dto/follow-organization.dto.ts` - DTOs for following
- `api/src/organizations/user-follows.service.ts` - Service for following logic

---

## API Summary

### New Endpoints
1. `GET /events/nearby` - Find events near a location
2. `POST /organizations/:id/follow` - Follow an organization
3. `DELETE /organizations/:id/follow` - Unfollow an organization
4. `GET /auth/me/following` - Get user's following list
5. `GET /organizations/:id/followers` - Get organization followers

### Updated Endpoints
1. `POST /venues` - Now accepts latitude/longitude
2. `PATCH /venues/:id` - Now accepts latitude/longitude
3. `POST /events` - Now accepts latitude/longitude
4. `PATCH /events/:id` - Now accepts latitude/longitude
5. `GET /events` - Now supports `?following=true` filter
6. `GET /organizations/:id` - Now includes followerCount and isFollowing

---

**Implementation Date**: 2025-10-22
**Status**: ✅ Complete (Pending Testing)

