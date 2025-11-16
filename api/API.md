# Event Management API Documentation

## Overview

The Event Management API is a comprehensive backend system for managing events, ticketing, organizations, and payments - similar to Eventbrite or Ticketmaster. Built with NestJS, Prisma, PostgreSQL, and Redis.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Organizations](#organizations)
  - [Organization Reviews](#organization-reviews)
- [Events](#events)
  - [Event Reviews](#event-reviews)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Webhooks](#webhooks)

## Getting Started

### Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://api.yourdomain.com`

### Interactive Documentation

Swagger/OpenAPI documentation is available at:

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.yourdomain.com/api`

### Authentication

Most endpoints require authentication using JWT Bearer tokens.

```bash
Authorization: Bearer <your-access-token>
```

## Authentication

### Register

Create a new user account.

**Endpoint**: `POST /auth/register`

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "phone": "+2348012345678"
}
```

**Response** (201):

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "attendee",
  "status": "active",
  "createdAt": "2025-10-22T21:17:47.156Z"
}
```

### Login

Authenticate and receive access token.

**Endpoint**: `POST /auth/login`

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "attendee"
  }
}
```

**Note**: Refresh token is set as HTTP-only cookie.

### Get Profile

Get authenticated user's profile.

**Endpoint**: `GET /auth/profile`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "attendee",
  "status": "active"
}
```

### Update Profile

Update user profile information.

**Endpoint**: `PATCH /auth/profile`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "name": "John Updated",
  "phone": "+2348087654321",
  "email": "newemail@example.com"
}
```

### Change Password

Change user password.

**Endpoint**: `POST /auth/change-password`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Note**: This revokes all active sessions for security.

### API Keys

#### Create API Key

**Endpoint**: `POST /auth/api-keys`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "name": "My Integration Key",
  "scopes": ["events:read", "events:write"]
}
```

**Response** (201):

```json
{
  "id": "key_id",
  "name": "My Integration Key",
  "prefix": "16dd8c12",
  "secret": "16dd8c12.16dd8c125b3c73a0bb7604ba546fcfb48a573b6eab5d939ae96baf22e00049118",
  "scopes": ["events:read", "events:write"],
  "createdAt": "2025-10-22T21:18:15.644Z",
  "lastUsedAt": null
}
```

**Important**: Save the secret immediately - it won't be shown again!

#### List API Keys

**Endpoint**: `GET /auth/api-keys`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):

```json
[
  {
    "id": "key_id",
    "name": "My Integration Key",
    "prefix": "16dd8c12",
    "scopes": ["events:read", "events:write"],
    "createdAt": "2025-10-22T21:18:15.644Z",
    "lastUsedAt": null
  }
]
```

#### Revoke API Key

**Endpoint**: `DELETE /auth/api-keys/:id`

**Headers**: `Authorization: Bearer <token>`

### Logout

**Endpoint**: `POST /auth/logout`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):

```json
{
  "message": "Logout successful"
}
```

### Refresh Token

**Endpoint**: `POST /auth/refresh`

**Request Body**:

```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response** (200):

```json
{
  "accessToken": "new-access-token"
}
```

## Organizations

Organizations are the core entity for event organizers. Each organization can have multiple members with different roles.

### Create Organization

**Endpoint**: `POST /organizations`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "name": "Tech Events Nigeria",
  "legalName": "Tech Events Nigeria Limited",
  "website": "https://techevents.ng",
  "country": "Nigeria",
  "supportEmail": "support@techevents.ng",
  "taxId": "12345678-0001"
}
```

**Response** (201):

```json
{
  "id": "org_id",
  "ownerId": "user_id",
  "name": "Tech Events Nigeria",
  "legalName": "Tech Events Nigeria Limited",
  "website": "https://techevents.ng",
  "country": "Nigeria",
  "supportEmail": "support@techevents.ng",
  "taxId": "12345678-0001",
  "status": "pending",
  "createdAt": "2025-10-22T21:27:48.468Z",
  "members": [
    {
      "userId": "user_id",
      "role": "owner",
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "name": "John Doe"
      }
    }
  ]
}
```

### List Organizations

**Endpoint**: `GET /organizations`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):

```json
[
  {
    "id": "org_id",
    "name": "Tech Events Nigeria",
    "status": "active",
    "_count": {
      "events": 5,
      "members": 3,
      "venues": 2
    }
  }
]
```

### Get Organization

**Endpoint**: `GET /organizations/:id`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):

```json
{
  "id": "org_id",
  "name": "Tech Events Nigeria",
  "legalName": "Tech Events Nigeria Limited",
  "website": "https://techevents.ng",
  "country": "Nigeria",
  "status": "active",
  "followerCount": 150,
  "isFollowing": true,
  "members": [...],
  "venues": [...],
  "events": [...],
  "_count": {
    "events": 25,
    "members": 5,
    "venues": 3
  }
}
```

**New Fields**:

- `followerCount`: Number of users following this organization
- `isFollowing`: Whether the current user is following this organization

### Update Organization

**Endpoint**: `PATCH /organizations/:id`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "name": "Updated Name",
  "website": "https://newwebsite.com"
}
```

### Delete Organization

**Endpoint**: `DELETE /organizations/:id`

**Headers**: `Authorization: Bearer <token>`

**Note**: Only organization owners can delete organizations.

### Organization Reviews

Attendees can also rate and review an organization as a whole. Ratings use the same 1-5 scale and comments are optional with a 1000 character limit.

#### Create Organization Review

**Endpoint**: `POST /organizations/:orgId/reviews`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "rating": 5,
  "comment": "Professional team with excellent communication."
}
```

**Response** (201):

```json
{
  "id": "review_id",
  "orgId": "org_id",
  "userId": "user_id",
  "rating": 5,
  "comment": "Professional team with excellent communication.",
  "createdAt": "2025-03-14T10:00:00.000Z",
  "updatedAt": "2025-03-14T10:00:00.000Z",
  "user": {
    "id": "user_id",
    "name": "Ada Lovelace"
  }
}
```

**Notes**:

- Users must have attended at least one non-refunded, non-void ticketed event hosted by the organization before leaving a review.
- Users can only create one review per organization.

#### Update Organization Review

**Endpoint**: `PATCH /organizations/:orgId/reviews/:reviewId`

**Headers**: `Authorization: Bearer <token>`

**Request Body** (all fields optional):

```json
{
  "rating": 4,
  "comment": "Still great overall, but communication was slower this time"
}
```

**Response** (200): Returns the updated review object (same shape as creation response).

#### Delete Organization Review

**Endpoint**: `DELETE /organizations/:orgId/reviews/:reviewId`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):

```json
{
  "success": true
}
```

#### List Organization Reviews

**Endpoint**: `GET /organizations/:orgId/reviews`

**Query Parameters**:

- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response** (200):

```json
{
  "data": [
    {
      "id": "review_id",
      "orgId": "org_id",
      "userId": "user_id",
      "rating": 5,
      "comment": "Professional team with excellent communication.",
      "createdAt": "2025-03-14T10:00:00.000Z",
      "updatedAt": "2025-03-14T10:00:00.000Z",
      "user": {
        "id": "user_id",
        "name": "Ada Lovelace"
      }
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### Organization Review Summary

**Endpoint**: `GET /organizations/:orgId/reviews/summary`

**Response** (200):

```json
{
  "averageRating": 4.8,
  "reviewCount": 8
}
```

**Notes**:

- `averageRating` is returned as a numeric value (0 when no reviews exist).
- `reviewCount` is the total number of reviews stored for the organization.

### Organization Members

#### Add Member

**Endpoint**: `POST /organizations/:id/members`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "email": "member@example.com",
  "role": "manager"
}
```

**Roles**: `owner`, `manager`, `staff`

#### List Members

**Endpoint**: `GET /organizations/:id/members`

**Headers**: `Authorization: Bearer <token>`

#### Update Member Role

**Endpoint**: `PATCH /organizations/:id/members/:memberId`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "role": "staff"
}
```

#### Remove Member

**Endpoint**: `DELETE /organizations/:id/members/:memberId`

**Headers**: `Authorization: Bearer <token>`

### Organization Following

#### Follow Organization

**Endpoint**: `POST /organizations/:id/follow`

**Headers**: `Authorization: Bearer <token>`

**Description**: Follow an organization to receive updates about their events.

**Response** (201):

```json
{
  "id": "follow_id",
  "userId": "user_id",
  "organizationId": "org_id",
  "createdAt": "2025-10-22T15:30:00Z"
}
```

**Error Responses**:

- `404`: Organization not found
- `409`: Already following this organization

#### Unfollow Organization

**Endpoint**: `DELETE /organizations/:id/follow`

**Headers**: `Authorization: Bearer <token>`

**Description**: Unfollow an organization.

**Response** (200):

```json
{
  "message": "Successfully unfollowed organization"
}
```

**Error Responses**:

- `404`: Not following this organization

#### Get Organization Followers

**Endpoint**: `GET /organizations/:id/followers`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `includeUsers`: Set to `true` to get full follower list with user details (optional)

**Response without `includeUsers`** (200):

```json
{
  "count": 150
}
```

**Response with `includeUsers=true`** (200):

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
      "createdAt": "2025-10-22T15:30:00Z"
    }
  ]
}
```

#### Get My Following List

**Endpoint**: `GET /auth/me/following`

**Headers**: `Authorization: Bearer <token>`

**Description**: Get list of organizations the current user is following.

**Response** (200):

```json
[
  {
    "id": "follow_id",
    "organizationId": "org_id",
    "organization": {
      "id": "org_id",
      "name": "Tech Events Nigeria",
      "legalName": "Tech Events Nigeria Limited",
      "website": "https://techevents.ng",
      "country": "Nigeria",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "followedAt": "2024-01-20T15:30:00Z"
  }
]
```

## Events

Events are the core product of the platform. Each event belongs to an organization.

### Create Event

**Endpoint**: `POST /events/org/:orgId`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "title": "Tech Conference 2025",
  "description": "Annual technology conference",
  "categoryId": "category_id",
  "venueId": "venue_id",
  "seatmapId": "seatmap_id",
  "timezone": "Africa/Lagos",
  "currency": "NGN",
  "isPublic": true,
  "requiresApproval": false,
  "ageRestriction": 18,
  "latitude": 6.5244,
  "longitude": 3.3792
}
```

**Optional Fields**:

- `latitude`: Event latitude coordinate (for events without a venue or to override venue location)
- `longitude`: Event longitude coordinate (for events without a venue or to override venue location)

**Note**: If both event and venue have coordinates, the event's coordinates take precedence for location-based searches.

### List Public Events

**Endpoint**: `GET /events`

**Query Parameters**:

- `status`: Filter by status (draft, published, cancelled)
- `categoryId`: Filter by category
- `upcoming`: Show only upcoming events (true/false)
- `search`: Search by title or description
- `following`: Filter events from followed organizations (true/false, requires authentication)

**Example with Following Filter**:

```bash
GET /events?following=true
Authorization: Bearer <token>
```

**Response** (200):

```json
{
  "data": [
    {
      "id": "event_id",
      "title": "Tech Conference 2025",
      "org": {
        "id": "org_id",
        "name": "Tech Events Nigeria"
      },
      ...
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Find Nearby Events

**Endpoint**: `GET /events/nearby`

**Description**: Find events near a geographic location using latitude and longitude coordinates.

**Query Parameters** (all required except radius, page, limit):

- `latitude`: User's current latitude (-90 to 90)
- `longitude`: User's current longitude (-180 to 180)
- `radius`: Search radius in kilometers (default: 50, max: 500)
- `page`: Page number for pagination (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Example**:

```bash
GET /events/nearby?latitude=6.5244&longitude=3.3792&radius=25&page=1&limit=20
```

**Response** (200):

```json
{
  "data": [
    {
      "id": "event_id",
      "title": "Lagos Tech Summit 2025",
      "distance": 12.45,
      "coordinates": {
        "latitude": 6.4281,
        "longitude": 3.4219
      },
      "org": {
        "id": "org_id",
        "name": "Tech Events Nigeria"
      },
      "venue": {
        "id": "venue_id",
        "name": "Eko Convention Center",
        "address": {
          "city": "Lagos",
          "country": "Nigeria"
        }
      },
      "startsAt": "2025-12-01T10:00:00Z",
      "endsAt": "2025-12-01T18:00:00Z",
      "status": "published"
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

**Notes**:

- Events are sorted by distance (closest first)
- Distance is calculated using the Haversine formula
- Only public, live events with coordinates are returned
- Coordinates come from the event itself or its venue

### Get My Events

**Endpoint**: `GET /events/my`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `status`: Filter by status
- `categoryId`: Filter by category
- `orgId`: Filter by organization
- `upcoming`: Show only upcoming events

### Get Event

**Endpoint**: `GET /events/:id`

### Update Event

**Endpoint**: `PATCH /events/:id`

**Headers**: `Authorization: Bearer <token>`

### Delete Event

**Endpoint**: `DELETE /events/:id`

**Headers**: `Authorization: Bearer <token>`

### Event Reviews

Reviews let attendees share feedback about the experiences they have at an event. Ratings are whole numbers from **1 (worst)** to **5 (best)** and comments are optional but capped at 1000 characters.

#### Create Event Review

**Endpoint**: `POST /events/:eventId/reviews`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "rating": 5,
  "comment": "Amazing atmosphere and smooth check-in!"
}
```

**Response** (201):

```json
{
  "id": "review_id",
  "eventId": "event_id",
  "userId": "user_id",
  "rating": 5,
  "comment": "Amazing atmosphere and smooth check-in!",
  "createdAt": "2025-03-14T10:00:00.000Z",
  "updatedAt": "2025-03-14T10:00:00.000Z",
  "user": {
    "id": "user_id",
    "name": "Ada Lovelace"
  }
}
```

**Notes**:

- A user must hold a non-refunded, non-void ticket for the event before posting a review.
- Users can only create one review per event.

#### Update Event Review

**Endpoint**: `PATCH /events/:eventId/reviews/:reviewId`

**Headers**: `Authorization: Bearer <token>`

**Request Body** (all fields optional):

```json
{
  "rating": 4,
  "comment": "Still great, but the audio could be louder"
}
```

**Response** (200): Returns the updated review object (same shape as creation response).

#### Delete Event Review

**Endpoint**: `DELETE /events/:eventId/reviews/:reviewId`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):

```json
{
  "success": true
}
```

#### List Event Reviews

**Endpoint**: `GET /events/:eventId/reviews`

**Query Parameters**:

- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response** (200):

```json
{
  "data": [
    {
      "id": "review_id",
      "eventId": "event_id",
      "userId": "user_id",
      "rating": 5,
      "comment": "Amazing atmosphere and smooth check-in!",
      "createdAt": "2025-03-14T10:00:00.000Z",
      "updatedAt": "2025-03-14T10:00:00.000Z",
      "user": {
        "id": "user_id",
        "name": "Ada Lovelace"
      }
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### Event Review Summary

**Endpoint**: `GET /events/:eventId/reviews/summary`

**Response** (200):

```json
{
  "averageRating": 4.6,
  "reviewCount": 12
}
```

**Notes**:

- `averageRating` is rounded to two decimal places in the database and returned as a number.
- `reviewCount` represents the total number of published reviews for the event.

### Event Policies

**Endpoint**: `PATCH /events/:id/policies`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "refundPolicy": "full",
  "refundDeadlineHours": 24,
  "transferPolicy": "allowed",
  "cancellationPolicy": "Refunds available up to 24 hours before event"
}
```

### Event Occurrences

#### Create Occurrence

**Endpoint**: `POST /events/:id/occurrences`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "startsAt": "2025-12-01T10:00:00Z",
  "endsAt": "2025-12-01T18:00:00Z",
  "doorsOpenAt": "2025-12-01T09:00:00Z"
}
```

#### List Occurrences

**Endpoint**: `GET /events/:id/occurrences`

### Event Assets

#### Add Asset

**Endpoint**: `POST /events/:id/assets`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "kind": "image",
  "url": "https://example.com/image.jpg",
  "altText": "Event banner"
}
```

**Asset Kinds**: `image`, `pdf`, `video`, `seatmap-render`

#### Get Assets

**Endpoint**: `GET /events/:id/assets`

#### Delete Asset

**Endpoint**: `DELETE /events/:id/assets/:assetId`

**Headers**: `Authorization: Bearer <token>`

## Venues

Venues are physical or virtual locations where events take place.

### Create Venue

**Endpoint**: `POST /venues/org/:orgId`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "name": "Lagos Convention Center",
  "address": {
    "line1": "123 Main Street",
    "city": "Lagos",
    "region": "Lagos State",
    "postal": "100001",
    "country": "Nigeria"
  },
  "capacity": 5000,
  "timezone": "Africa/Lagos",
  "latitude": 6.4281,
  "longitude": 3.4219
}
```

**Optional Fields**:

- `latitude`: Venue latitude coordinate (-90 to 90)
- `longitude`: Venue longitude coordinate (-180 to 180)

**Note**: Adding coordinates enables the venue's events to appear in location-based searches.

### List Venues

**Endpoint**: `GET /venues`

### Get Venue

**Endpoint**: `GET /venues/:id`

### Update Venue

**Endpoint**: `PATCH /venues/:id`

**Headers**: `Authorization: Bearer <token>`

### Delete Venue

**Endpoint**: `DELETE /venues/:id`

**Headers**: `Authorization: Bearer <token>`

## Seatmaps

Seatmaps define the seating layout for venues.

### Create Seatmap

**Endpoint**: `POST /seatmaps/org/:orgId`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "name": "Main Hall Layout",
  "venueId": "venue_id",
  "totalSeats": 500
}
```

### Add Seats

**Endpoint**: `POST /seatmaps/:id/seats`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "seats": [
    {
      "section": "VIP",
      "row": "A",
      "number": "1",
      "x": 100,
      "y": 200
    }
  ]
}
```

### List Seatmaps

**Endpoint**: `GET /seatmaps`

### Get Seatmap

**Endpoint**: `GET /seatmaps/:id`

### Delete Seat

**Endpoint**: `DELETE /seatmaps/seats/:seatId`

**Headers**: `Authorization: Bearer <token>`

## Ticketing

### Ticket Types

#### Create Ticket Type

**Endpoint**: `POST /ticketing/events/:eventId/ticket-types`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "name": "VIP Pass",
  "description": "VIP access with premium seating",
  "basePrice": 50000,
  "currency": "NGN",
  "quantity": 100,
  "minPerOrder": 1,
  "maxPerOrder": 10,
  "salesStartAt": "2025-11-01T00:00:00Z",
  "salesEndAt": "2025-12-01T00:00:00Z",
  "isPublic": true
}
```

#### List Ticket Types

**Endpoint**: `GET /ticketing/events/:eventId/ticket-types`

#### Get Ticket Type

**Endpoint**: `GET /ticketing/ticket-types/:id`

#### Update Ticket Type

**Endpoint**: `PATCH /ticketing/ticket-types/:id`

**Headers**: `Authorization: Bearer <token>`

#### Delete Ticket Type

**Endpoint**: `DELETE /ticketing/ticket-types/:id`

**Headers**: `Authorization: Bearer <token>`

### Price Tiers

**Endpoint**: `POST /ticketing/ticket-types/:ticketTypeId/price-tiers`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "name": "Early Bird",
  "price": 40000,
  "quantity": 50,
  "startsAt": "2025-11-01T00:00:00Z",
  "endsAt": "2025-11-15T00:00:00Z"
}
```

### Holds

Holds temporarily reserve tickets for a specific time period.

#### Create Hold

**Endpoint**: `POST /ticketing/events/:eventId/holds`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "ticketTypeId": "ticket_type_id",
  "quantity": 5,
  "expiresAt": "2025-12-01T10:00:00Z",
  "reason": "Group booking"
}
```

#### List Holds

**Endpoint**: `GET /ticketing/events/:eventId/holds`

**Headers**: `Authorization: Bearer <token>`

#### Release Hold

**Endpoint**: `DELETE /ticketing/holds/:holdId`

**Headers**: `Authorization: Bearer <token>`

## Orders

### Create Order

**Endpoint**: `POST /orders`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "eventId": "event_id",
  "items": [
    {
      "ticketTypeId": "ticket_type_id",
      "quantity": 2,
      "priceTierId": "price_tier_id"
    }
  ],
  "promoCode": "EARLYBIRD2025"
}
```

### List Orders

**Endpoint**: `GET /orders`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `status`: Filter by status (pending, confirmed, cancelled, refunded)
- `eventId`: Filter by event

### Get Order

**Endpoint**: `GET /orders/:id`

**Headers**: `Authorization: Bearer <token>`

### Update Order

**Endpoint**: `PATCH /orders/:id`

**Headers**: `Authorization: Bearer <token>`

### Cancel Order

**Endpoint**: `DELETE /orders/:id`

**Headers**: `Authorization: Bearer <token>`

### Process Payment

**Endpoint**: `POST /orders/:id/payment/process`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "provider": "stripe",
  "paymentMethodId": "pm_xxx"
}
```

**Providers**: `stripe`, `paystack`

### Order Statistics

**Endpoint**: `GET /orders/stats`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `eventId`: Filter by event
- `orgId`: Filter by organization
- `startDate`: Start date for stats
- `endDate`: End date for stats

## Tickets

### List My Tickets

**Endpoint**: `GET /tickets`

**Headers**: `Authorization: Bearer <token>`

### Get Ticket

**Endpoint**: `GET /tickets/:id`

**Headers**: `Authorization: Bearer <token>`

### Transfer Ticket

**Endpoint**: `POST /tickets/transfer`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "ticketId": "ticket_id",
  "recipientEmail": "recipient@example.com",
  "message": "Enjoy the event!"
}
```

### Accept Transfer

**Endpoint**: `POST /tickets/transfer/accept`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "transferId": "transfer_id"
}
```

### Cancel Transfer

**Endpoint**: `DELETE /tickets/transfer/:transferId`

**Headers**: `Authorization: Bearer <token>`

### Check-in Ticket

**Endpoint**: `POST /tickets/checkin`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "ticketId": "ticket_id",
  "occurrenceId": "occurrence_id"
}
```

### Get Check-ins

**Endpoint**: `GET /tickets/events/:eventId/checkins`

**Headers**: `Authorization: Bearer <token>`

### Regenerate QR Code

**Endpoint**: `POST /tickets/:id/regenerate-qr`

**Headers**: `Authorization: Bearer <token>`

## Promotions

### Create Promotion

**Endpoint**: `POST /promotions/orgs/:orgId/promotions`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "name": "Early Bird Discount",
  "description": "20% off for early registrations",
  "discountType": "percentage",
  "discountValue": 20,
  "startsAt": "2025-11-01T00:00:00Z",
  "endsAt": "2025-11-15T23:59:59Z",
  "maxUses": 100
}
```

### Create Promo Code

**Endpoint**: `POST /promotions/orgs/:orgId/promo-codes`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "code": "EARLYBIRD2025",
  "promotionId": "promotion_id",
  "maxUses": 50,
  "expiresAt": "2025-11-15T23:59:59Z"
}
```

### Validate Promo Code

**Endpoint**: `POST /promotions/validate`

**Request Body**:

```json
{
  "code": "EARLYBIRD2025",
  "eventId": "event_id"
}
```

## Webhooks

### Create Webhook

**Endpoint**: `POST /webhooks/orgs/:orgId/webhooks`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "url": "https://yourapp.com/webhooks",
  "events": ["order.created", "ticket.transferred"],
  "secret": "your-webhook-secret"
}
```

**Available Events**:

- `order.created`
- `order.confirmed`
- `order.cancelled`
- `ticket.transferred`
- `ticket.checkedin`
- `event.published`
- `event.cancelled`

### List Webhooks

**Endpoint**: `GET /webhooks/orgs/:orgId/webhooks`

**Headers**: `Authorization: Bearer <token>`

### Get Webhook Events

**Endpoint**: `GET /webhooks/orgs/:orgId/webhooks/:webhookId/events`

**Headers**: `Authorization: Bearer <token>`

### Retry Webhook Event

**Endpoint**: `POST /webhooks/orgs/:orgId/webhooks/:webhookId/events/:eventId/retry`

**Headers**: `Authorization: Bearer <token>`

## Error Handling

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Validation Errors

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than 8 characters"
  ],
  "error": "Bad Request"
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635724800
```

## Data Models

### User

```typescript
{
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'attendee' | 'organizer' | 'admin';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}
```

### Organization

```typescript
{
  id: string;
  ownerId: string;
  name: string;
  legalName?: string;
  website?: string;
  country?: string;
  supportEmail?: string;
  taxId?: string;
  status: 'pending' | 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}
```

### Event

```typescript
{
  id: string;
  orgId: string;
  title: string;
  description?: string;
  categoryId?: string;
  venueId?: string;
  seatmapId?: string;
  timezone: string;
  currency: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isPublic: boolean;
  requiresApproval: boolean;
  ageRestriction?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Order

```typescript
{
  id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  subtotal: number;
  fees: number;
  discount: number;
  total: number;
  currency: string;
  paymentProvider?: string;
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Ticket

```typescript
{
  id: string;
  orderId: string;
  ticketTypeId: string;
  userId: string;
  status: 'valid' | 'used' | 'cancelled' | 'transferred';
  qrCode: string;
  price: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Pagination

List endpoints support pagination using query parameters:

```
GET /events?page=1&limit=20
```

**Response**:

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

## Filtering and Sorting

Most list endpoints support filtering and sorting:

```
GET /events?status=published&sort=-createdAt&search=conference
```

- **Filtering**: Use query parameters matching field names
- **Sorting**: Use `sort` parameter with field name (prefix with `-` for descending)
- **Search**: Use `search` parameter for full-text search

## Best Practices

1. **Always use HTTPS** in production
2. **Store access tokens securely** (never in localStorage for web apps)
3. **Implement proper error handling** for all API calls
4. **Use webhooks** for real-time updates instead of polling
5. **Respect rate limits** and implement exponential backoff
6. **Validate data** on the client side before sending to API
7. **Use idempotency keys** for payment operations
8. **Implement proper logging** for debugging

## Support

For API support:

- **Documentation**: http://localhost:3000/api (Swagger)
- **Issues**: Create an issue in the repository
- **Email**: support@yourdomain.com
