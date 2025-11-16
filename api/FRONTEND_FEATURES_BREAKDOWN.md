# Frontend Features Implementation Breakdown

A structured guide for implementing the Geolocation and Following System features in the frontend application.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Feature 1: Location-Based Event Discovery](#feature-1-location-based-event-discovery)
- [Feature 2: User Following System](#feature-2-user-following-system)
- [Recommended Libraries](#recommended-libraries)
- [Project Structure](#project-structure)

---

## Architecture Overview

### Recommended Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite or Next.js 14+
- **State Management**: React Query (TanStack Query) for server state + Zustand for client state
- **Styling**: Tailwind CSS or Material-UI
- **Maps**: Leaflet or Mapbox GL JS
- **HTTP Client**: Axios or Fetch API with custom wrapper

### State Management Strategy

```typescript
// Server State (React Query)
- API data fetching and caching
- Automatic refetching and invalidation
- Optimistic updates

// Client State (Zustand)
- User preferences (map view, filters)
- UI state (modals, drawers)
- Temporary form data
```

---

## Feature 1: Location-Based Event Discovery

### 1.1 Module Structure

```
src/
├── features/
│   └── geolocation/
│       ├── components/
│       │   ├── EventMap.tsx
│       │   ├── EventMapMarker.tsx
│       │   ├── NearbyEventsList.tsx
│       │   ├── NearbyEventCard.tsx
│       │   ├── LocationPermissionPrompt.tsx
│       │   ├── RadiusSelector.tsx
│       │   └── DistanceBadge.tsx
│       ├── hooks/
│       │   ├── useGeolocation.ts
│       │   ├── useNearbyEvents.ts
│       │   └── useEventCoordinates.ts
│       ├── services/
│       │   └── geolocation.service.ts
│       ├── types/
│       │   └── geolocation.types.ts
│       └── utils/
│           ├── distance.utils.ts
│           └── coordinates.utils.ts
```

### 1.2 TypeScript Interfaces

```typescript
// src/features/geolocation/types/geolocation.types.ts

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface EventWithDistance {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  distance: number; // in kilometers
  coordinates: Coordinates;
  org: {
    id: string;
    name: string;
  };
  venue?: {
    id: string;
    name: string;
    address: string;
  };
  category?: string;
  status: 'draft' | 'published' | 'cancelled';
}

export interface NearbyEventsResponse {
  data: EventWithDistance[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NearbyEventsParams {
  latitude: number;
  longitude: number;
  radius?: number; // default: 50km
  page?: number;
  limit?: number;
}

export interface GeolocationState {
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | null;
}
```

### 1.3 API Service Layer

```typescript
// src/features/geolocation/services/geolocation.service.ts

import { apiClient } from '@/lib/api-client';
import type {
  NearbyEventsResponse,
  NearbyEventsParams,
} from '../types/geolocation.types';

export const geolocationService = {
  /**
   * Fetch events near a specific location
   */
  async getNearbyEvents(
    params: NearbyEventsParams,
  ): Promise<NearbyEventsResponse> {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      radius: (params.radius || 50).toString(),
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
    });

    return apiClient.get(`/events/nearby?${queryParams}`);
  },

  /**
   * Create venue with coordinates
   */
  async createVenueWithLocation(data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    // ... other venue fields
  }) {
    return apiClient.post('/venues/org/:orgId', data);
  },

  /**
   * Create event with coordinates (for events without venue)
   */
  async createEventWithLocation(data: {
    title: string;
    latitude?: number;
    longitude?: number;
    // ... other event fields
  }) {
    return apiClient.post('/events/org/:orgId', data);
  },
};
```

### 1.4 Custom Hooks

```typescript
// src/features/geolocation/hooks/useGeolocation.ts

import { useState, useEffect } from 'react';
import type { GeolocationState } from '../types/geolocation.types';

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    loading: false,
    error: null,
    permissionStatus: null,
  });

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const permission = await navigator.permissions.query({
        name: 'geolocation',
      });
      setState((prev) => ({ ...prev, permissionStatus: permission.state }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            loading: false,
            error: null,
            permissionStatus: 'granted',
          });
        },
        (error) => {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
            permissionStatus: 'denied',
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to get location permission',
      }));
    }
  };

  return {
    ...state,
    requestLocation,
  };
}
```

```typescript
// src/features/geolocation/hooks/useNearbyEvents.ts

import { useQuery } from '@tanstack/react-query';
import { geolocationService } from '../services/geolocation.service';
import type { NearbyEventsParams } from '../types/geolocation.types';

export function useNearbyEvents(params: NearbyEventsParams, enabled = true) {
  return useQuery({
    queryKey: ['nearbyEvents', params],
    queryFn: () => geolocationService.getNearbyEvents(params),
    enabled: enabled && !!params.latitude && !!params.longitude,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
```

### 1.5 UI Components

#### EventMap Component

```typescript
// src/features/geolocation/components/EventMap.tsx

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { EventMapMarker } from './EventMapMarker';
import type { EventWithDistance, Coordinates } from '../types/geolocation.types';

interface EventMapProps {
  events: EventWithDistance[];
  userLocation: Coordinates;
  onEventClick?: (eventId: string) => void;
}

export function EventMap({ events, userLocation, onEventClick }: EventMapProps) {
  return (
    <MapContainer
      center={[userLocation.latitude, userLocation.longitude]}
      zoom={12}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* User location marker */}
      <Marker position={[userLocation.latitude, userLocation.longitude]}>
        <Popup>Your Location</Popup>
      </Marker>

      {/* Event markers */}
      {events.map((event) => (
        <EventMapMarker
          key={event.id}
          event={event}
          onClick={() => onEventClick?.(event.id)}
        />
      ))}
    </MapContainer>
  );
}
```

#### NearbyEventsList Component

```typescript
// src/features/geolocation/components/NearbyEventsList.tsx

import { useGeolocation } from '../hooks/useGeolocation';
import { useNearbyEvents } from '../hooks/useNearbyEvents';
import { NearbyEventCard } from './NearbyEventCard';
import { LocationPermissionPrompt } from './LocationPermissionPrompt';
import { RadiusSelector } from './RadiusSelector';
import { useState } from 'react';

export function NearbyEventsList() {
  const [radius, setRadius] = useState(50);
  const [page, setPage] = useState(1);

  const { coordinates, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();

  const { data, isLoading, error } = useNearbyEvents(
    {
      latitude: coordinates?.latitude || 0,
      longitude: coordinates?.longitude || 0,
      radius,
      page,
      limit: 20,
    },
    !!coordinates
  );

  if (!coordinates) {
    return (
      <LocationPermissionPrompt
        onRequestLocation={requestLocation}
        loading={locationLoading}
        error={locationError}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Events Near You</h2>
        <RadiusSelector value={radius} onChange={setRadius} />
      </div>

      {isLoading && <div>Loading nearby events...</div>}
      {error && <div className="text-red-500">Error: {error.message}</div>}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((event) => (
              <NearbyEventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {page} of {data.meta.totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.meta.totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

### 1.6 Utility Functions

```typescript
// src/features/geolocation/utils/distance.utils.ts

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`;
  }
  return `${km.toFixed(1)}km away`;
}

export function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
```

---

## Feature 2: User Following System

### 2.1 Module Structure

```
src/
├── features/
│   └── following/
│       ├── components/
│       │   ├── FollowButton.tsx
│       │   ├── FollowingList.tsx
│       │   ├── FollowersList.tsx
│       │   ├── FollowerCount.tsx
│       │   └── FollowedEventsFilter.tsx
│       ├── hooks/
│       │   ├── useFollowOrganization.ts
│       │   ├── useUnfollowOrganization.ts
│       │   ├── useFollowingList.ts
│       │   └── useFollowersList.ts
│       ├── services/
│       │   └── following.service.ts
│       └── types/
│           └── following.types.ts
```

### 2.2 TypeScript Interfaces

```typescript
// src/features/following/types/following.types.ts

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  website?: string;
  country: string;
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  followerCount?: number;
  isFollowing?: boolean;
}

export interface FollowRecord {
  id: string;
  userId: string;
  organizationId: string;
  createdAt: string;
}

export interface FollowingItem {
  id: string;
  organizationId: string;
  organization: Organization;
  followedAt: string;
}

export interface FollowerItem {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface FollowersResponse {
  total: number;
  followers?: FollowerItem[];
}
```

### 2.3 API Service Layer

```typescript
// src/features/following/services/following.service.ts

import { apiClient } from '@/lib/api-client';
import type {
  FollowRecord,
  FollowingItem,
  FollowersResponse,
} from '../types/following.types';

export const followingService = {
  /**
   * Follow an organization
   */
  async followOrganization(organizationId: string): Promise<FollowRecord> {
    return apiClient.post(`/organizations/${organizationId}/follow`);
  },

  /**
   * Unfollow an organization
   */
  async unfollowOrganization(organizationId: string): Promise<void> {
    return apiClient.delete(`/organizations/${organizationId}/follow`);
  },

  /**
   * Get list of organizations the user follows
   */
  async getFollowingList(): Promise<FollowingItem[]> {
    return apiClient.get('/auth/me/following');
  },

  /**
   * Get followers of an organization
   */
  async getFollowers(
    organizationId: string,
    includeUsers = false,
  ): Promise<FollowersResponse> {
    const params = includeUsers ? '?includeUsers=true' : '';
    return apiClient.get(`/organizations/${organizationId}/followers${params}`);
  },
};
```

### 2.4 Custom Hooks

```typescript
// src/features/following/hooks/useFollowOrganization.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followingService } from '../services/following.service';
import { toast } from 'react-hot-toast'; // or your toast library

export function useFollowOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) =>
      followingService.followOrganization(organizationId),
    onSuccess: (data, organizationId) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['followingList'] });
      queryClient.invalidateQueries({
        queryKey: ['organization', organizationId],
      });

      toast.success('Successfully followed organization!');
    },
    onError: (error: any) => {
      if (error.status === 409) {
        toast.error('You are already following this organization');
      } else if (error.status === 404) {
        toast.error('Organization not found');
      } else {
        toast.error('Failed to follow organization');
      }
    },
  });
}
```

```typescript
// src/features/following/hooks/useUnfollowOrganization.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followingService } from '../services/following.service';
import { toast } from 'react-hot-toast';

export function useUnfollowOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) =>
      followingService.unfollowOrganization(organizationId),
    onSuccess: (data, organizationId) => {
      queryClient.invalidateQueries({ queryKey: ['followingList'] });
      queryClient.invalidateQueries({
        queryKey: ['organization', organizationId],
      });

      toast.success('Successfully unfollowed organization');
    },
    onError: (error: any) => {
      if (error.status === 404) {
        toast.error('You are not following this organization');
      } else {
        toast.error('Failed to unfollow organization');
      }
    },
  });
}
```

```typescript
// src/features/following/hooks/useFollowingList.ts

import { useQuery } from '@tanstack/react-query';
import { followingService } from '../services/following.service';

export function useFollowingList() {
  return useQuery({
    queryKey: ['followingList'],
    queryFn: () => followingService.getFollowingList(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 2.5 UI Components

#### FollowButton Component

```typescript
// src/features/following/components/FollowButton.tsx

import { useFollowOrganization } from '../hooks/useFollowOrganization';
import { useUnfollowOrganization } from '../hooks/useUnfollowOrganization';

interface FollowButtonProps {
  organizationId: string;
  isFollowing: boolean;
  followerCount?: number;
  variant?: 'default' | 'compact';
}

export function FollowButton({
  organizationId,
  isFollowing,
  followerCount,
  variant = 'default',
}: FollowButtonProps) {
  const followMutation = useFollowOrganization();
  const unfollowMutation = useUnfollowOrganization();

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate(organizationId);
    } else {
      followMutation.mutate(organizationId);
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`px-4 py-2 rounded ${
          isFollowing
            ? 'bg-gray-200 hover:bg-gray-300'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`px-6 py-2 rounded-lg font-medium ${
          isFollowing
            ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
      </button>
      {followerCount !== undefined && (
        <span className="text-sm text-gray-600">
          {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  );
}
```

#### FollowingList Component

```typescript
// src/features/following/components/FollowingList.tsx

import { useFollowingList } from '../hooks/useFollowingList';
import { Link } from 'react-router-dom'; // or Next.js Link

export function FollowingList() {
  const { data: following, isLoading, error } = useFollowingList();

  if (isLoading) return <div>Loading your following list...</div>;
  if (error) return <div>Error loading following list</div>;
  if (!following || following.length === 0) {
    return <div>You are not following any organizations yet.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Organizations You Follow</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {following.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <Link
              to={`/organizations/${item.organization.id}`}
              className="text-lg font-semibold hover:text-blue-600"
            >
              {item.organization.name}
            </Link>
            <p className="text-sm text-gray-600">{item.organization.country}</p>
            <p className="text-xs text-gray-400 mt-2">
              Following since {new Date(item.followedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Recommended Libraries

### Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "react-router-dom": "^6.20.0"
  }
}
```

### Geolocation-Specific

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8"
  }
}
```

**Alternative**: For more advanced features, consider Mapbox GL JS:

```json
{
  "dependencies": {
    "mapbox-gl": "^3.0.0",
    "react-map-gl": "^7.1.0"
  }
}
```

### UI & Notifications

```json
{
  "dependencies": {
    "react-hot-toast": "^2.4.1",
    "tailwindcss": "^3.3.0"
  }
}
```

---

## Project Structure

### Recommended Full Structure

```
frontend/web-app/
├── src/
│   ├── features/
│   │   ├── geolocation/          # Feature 1
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── following/            # Feature 2
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── auth/
│   │   ├── events/
│   │   └── organizations/
│   ├── lib/
│   │   ├── api-client.ts
│   │   └── query-client.ts
│   ├── components/              # Shared components
│   ├── hooks/                   # Shared hooks
│   ├── types/                   # Shared types
│   ├── utils/                   # Shared utilities
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts              # or next.config.js
└── tailwind.config.js
```

---

## Integration Examples

### Example 1: Events Page with Nearby Filter

```typescript
// src/pages/EventsPage.tsx

import { useState } from 'react';
import { NearbyEventsList } from '@/features/geolocation/components/NearbyEventsList';
import { EventMap } from '@/features/geolocation/components/EventMap';
import { FollowedEventsFilter } from '@/features/following/components/FollowedEventsFilter';

export function EventsPage() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filterFollowing, setFilterFollowing] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Discover Events</h1>

        <div className="flex gap-4">
          {/* View mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'active' : ''}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={viewMode === 'map' ? 'active' : ''}
            >
              Map View
            </button>
          </div>

          {/* Following filter */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterFollowing}
              onChange={(e) => setFilterFollowing(e.target.checked)}
            />
            <span>Only from organizations I follow</span>
          </label>
        </div>
      </div>

      {viewMode === 'list' ? (
        <NearbyEventsList filterFollowing={filterFollowing} />
      ) : (
        <EventMap filterFollowing={filterFollowing} />
      )}
    </div>
  );
}
```

### Example 2: Organization Profile Page

```typescript
// src/pages/OrganizationProfilePage.tsx

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FollowButton } from '@/features/following/components/FollowButton';
import { FollowerCount } from '@/features/following/components/FollowerCount';
import { organizationService } from '@/services/organization.service';

export function OrganizationProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => organizationService.getById(id!),
  });

  if (isLoading) return <div>Loading...</div>;
  if (!org) return <div>Organization not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{org.name}</h1>
          <p className="text-gray-600">{org.legalName}</p>
          <p className="text-sm text-gray-500">{org.country}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <FollowButton
            organizationId={org.id}
            isFollowing={org.isFollowing || false}
            followerCount={org.followerCount}
          />
        </div>
      </div>

      {/* Organization events, etc. */}
    </div>
  );
}
```

### Example 3: Combined Nearby + Following Events

```typescript
// src/features/geolocation/components/NearbyEventsList.tsx (Enhanced)

import { useGeolocation } from '../hooks/useGeolocation';
import { useNearbyEvents } from '../hooks/useNearbyEvents';
import { useEventsQuery } from '@/features/events/hooks/useEventsQuery';
import { NearbyEventCard } from './NearbyEventCard';
import { useState } from 'react';

interface NearbyEventsListProps {
  filterFollowing?: boolean;
}

export function NearbyEventsList({
  filterFollowing = false,
}: NearbyEventsListProps) {
  const [radius, setRadius] = useState(50);
  const [page, setPage] = useState(1);

  const { coordinates, requestLocation } = useGeolocation();

  // Use different query based on filter
  const nearbyQuery = useNearbyEvents(
    {
      latitude: coordinates?.latitude || 0,
      longitude: coordinates?.longitude || 0,
      radius,
      page,
      limit: 20,
    },
    !!coordinates && !filterFollowing,
  );

  const followingQuery = useEventsQuery(
    {
      following: true,
      page,
      limit: 20,
    },
    filterFollowing,
  );

  const { data, isLoading, error } = filterFollowing
    ? followingQuery
    : nearbyQuery;

  // ... rest of component
}
```

---

## State Management Setup

### React Query Configuration

```typescript
// src/lib/query-client.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

```typescript
// src/App.tsx

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query-client';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app routes */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Zustand Store for UI State

```typescript
// src/stores/map-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Coordinates } from '@/features/geolocation/types/geolocation.types';

interface MapState {
  defaultRadius: number;
  setDefaultRadius: (radius: number) => void;
  lastKnownLocation: Coordinates | null;
  setLastKnownLocation: (coords: Coordinates) => void;
  mapViewPreference: 'list' | 'map';
  setMapViewPreference: (view: 'list' | 'map') => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      defaultRadius: 50,
      setDefaultRadius: (radius) => set({ defaultRadius: radius }),
      lastKnownLocation: null,
      setLastKnownLocation: (coords) => set({ lastKnownLocation: coords }),
      mapViewPreference: 'list',
      setMapViewPreference: (view) => set({ mapViewPreference: view }),
    }),
    {
      name: 'map-preferences',
    },
  ),
);
```

---

## Error Handling & Edge Cases

### Geolocation Error Handling

```typescript
// src/features/geolocation/components/LocationPermissionPrompt.tsx

interface LocationPermissionPromptProps {
  onRequestLocation: () => void;
  loading: boolean;
  error: string | null;
}

export function LocationPermissionPrompt({
  onRequestLocation,
  loading,
  error,
}: LocationPermissionPromptProps) {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-semibold mb-4">
          Enable Location to Find Nearby Events
        </h3>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-700">{error}</p>
            {error.includes('denied') && (
              <p className="text-sm text-red-600 mt-2">
                Please enable location permissions in your browser settings.
              </p>
            )}
          </div>
        )}

        <button
          onClick={onRequestLocation}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Getting Location...' : 'Enable Location'}
        </button>

        <p className="text-sm text-gray-500 mt-4">
          We'll use your location to show events happening near you.
        </p>
      </div>
    </div>
  );
}
```

### Following Error Handling

```typescript
// src/features/following/hooks/useFollowOrganization.ts (Enhanced)

export function useFollowOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) =>
      followingService.followOrganization(organizationId),

    // Optimistic update
    onMutate: async (organizationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['organization', organizationId],
      });

      // Snapshot previous value
      const previousOrg = queryClient.getQueryData([
        'organization',
        organizationId,
      ]);

      // Optimistically update
      queryClient.setQueryData(
        ['organization', organizationId],
        (old: any) => ({
          ...old,
          isFollowing: true,
          followerCount: (old?.followerCount || 0) + 1,
        }),
      );

      return { previousOrg };
    },

    onError: (error, organizationId, context) => {
      // Rollback on error
      if (context?.previousOrg) {
        queryClient.setQueryData(
          ['organization', organizationId],
          context.previousOrg,
        );
      }

      // Show error toast
      if (error.status === 409) {
        toast.error('You are already following this organization');
      } else if (error.status === 404) {
        toast.error('Organization not found');
      } else {
        toast.error('Failed to follow organization');
      }
    },

    onSettled: (data, error, organizationId) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ['organization', organizationId],
      });
      queryClient.invalidateQueries({ queryKey: ['followingList'] });
    },
  });
}
```

---

## Performance Optimization

### 1. Debounced Radius Changes

```typescript
// src/features/geolocation/hooks/useNearbyEvents.ts (Enhanced)

import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function useNearbyEvents(params: NearbyEventsParams, enabled = true) {
  // Debounce radius changes to avoid too many API calls
  const debouncedRadius = useDebouncedValue(params.radius, 500);

  return useQuery({
    queryKey: ['nearbyEvents', { ...params, radius: debouncedRadius }],
    queryFn: () =>
      geolocationService.getNearbyEvents({
        ...params,
        radius: debouncedRadius,
      }),
    enabled: enabled && !!params.latitude && !!params.longitude,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 2. Virtualized Lists for Large Results

```typescript
// src/features/geolocation/components/NearbyEventsList.tsx (with virtualization)

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function NearbyEventsList() {
  const parentRef = useRef<HTMLDivElement>(null);

  const { data } = useNearbyEvents(/* ... */);

  const virtualizer = useVirtualizer({
    count: data?.data.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height of each card
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const event = data?.data[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <NearbyEventCard event={event} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 3. Map Marker Clustering

```typescript
// src/features/geolocation/components/EventMap.tsx (with clustering)

import MarkerClusterGroup from 'react-leaflet-cluster';

export function EventMap({ events, userLocation }: EventMapProps) {
  return (
    <MapContainer /* ... */>
      <TileLayer /* ... */ />

      <Marker position={[userLocation.latitude, userLocation.longitude]}>
        <Popup>Your Location</Popup>
      </Marker>

      {/* Cluster markers when zoomed out */}
      <MarkerClusterGroup>
        {events.map((event) => (
          <EventMapMarker key={event.id} event={event} />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/features/geolocation/hooks/__tests__/useGeolocation.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { useGeolocation } from '../useGeolocation';

describe('useGeolocation', () => {
  beforeEach(() => {
    // Mock navigator.geolocation
    global.navigator.geolocation = {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn(),
    };
  });

  it('should request location successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 6.5244,
        longitude: 3.3792,
      },
    };

    (navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation(
      (success) => success(mockPosition),
    );

    const { result } = renderHook(() => useGeolocation());

    result.current.requestLocation();

    await waitFor(() => {
      expect(result.current.coordinates).toEqual({
        latitude: 6.5244,
        longitude: 3.3792,
      });
    });
  });

  it('should handle location permission denied', async () => {
    const mockError = { message: 'User denied geolocation' };

    (navigator.geolocation.getCurrentPosition as jest.Mock).mockImplementation(
      (success, error) => error(mockError),
    );

    const { result } = renderHook(() => useGeolocation());

    result.current.requestLocation();

    await waitFor(() => {
      expect(result.current.error).toBe('User denied geolocation');
      expect(result.current.permissionStatus).toBe('denied');
    });
  });
});
```

### Integration Tests

```typescript
// src/features/following/components/__tests__/FollowButton.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FollowButton } from '../FollowButton';
import { followingService } from '../../services/following.service';

jest.mock('../../services/following.service');

describe('FollowButton', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should follow organization when clicked', async () => {
    (followingService.followOrganization as jest.Mock).mockResolvedValue({
      id: 'follow-1',
      userId: 'user-1',
      organizationId: 'org-1',
    });

    render(
      <FollowButton
        organizationId="org-1"
        isFollowing={false}
        followerCount={10}
      />,
      { wrapper }
    );

    const button = screen.getByRole('button', { name: /follow/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(followingService.followOrganization).toHaveBeenCalledWith('org-1');
    });
  });
});
```

---

## Best Practices

### 1. API Error Handling

```typescript
// src/lib/api-client.ts

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message, response.status, error);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, error);
  }
}
```

### 2. Type Safety

```typescript
// Always use TypeScript interfaces for API responses
// src/types/api.types.ts

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Use generics for reusable hooks
export function usePaginatedQuery<T>(
  queryKey: string[],
  queryFn: (page: number) => Promise<ApiResponse<T[]>>,
  page: number,
) {
  return useQuery({
    queryKey: [...queryKey, page],
    queryFn: () => queryFn(page),
  });
}
```

### 3. Accessibility

```typescript
// Ensure all interactive elements are keyboard accessible
export function FollowButton({ organizationId, isFollowing }: FollowButtonProps) {
  return (
    <button
      onClick={handleClick}
      aria-label={isFollowing ? 'Unfollow organization' : 'Follow organization'}
      aria-pressed={isFollowing}
      className="..."
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
```

### 4. Loading States

```typescript
// Always show loading states for better UX
export function NearbyEventsList() {
  const { data, isLoading, isFetching } = useNearbyEvents(/* ... */);

  return (
    <div>
      {isFetching && (
        <div className="absolute top-0 right-0 p-2">
          <Spinner size="sm" />
        </div>
      )}

      {isLoading ? (
        <EventsListSkeleton />
      ) : (
        <EventsList events={data?.data} />
      )}
    </div>
  );
}
```

---

## Additional Dependencies for Production

```json
{
  "dependencies": {
    "@tanstack/react-virtual": "^3.0.0",
    "react-leaflet-cluster": "^2.1.0",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "vitest": "^1.0.0"
  }
}
```

---

## Next Steps for Frontend Team

### Phase 1: Setup (Week 1)

- [ ] Initialize React/Next.js project with TypeScript
- [ ] Install and configure dependencies
- [ ] Set up React Query and Zustand
- [ ] Create API client with authentication
- [ ] Set up routing structure

### Phase 2: Geolocation Feature (Week 2-3)

- [ ] Implement geolocation hooks
- [ ] Create map components with Leaflet
- [ ] Build nearby events list UI
- [ ] Add radius selector and filters
- [ ] Implement pagination
- [ ] Write unit tests

### Phase 3: Following System (Week 3-4)

- [ ] Implement following hooks and services
- [ ] Create follow button component
- [ ] Build following list page
- [ ] Add followers display
- [ ] Integrate with events filtering
- [ ] Write unit tests

### Phase 4: Integration & Polish (Week 4-5)

- [ ] Combine features in events page
- [ ] Add error boundaries
- [ ] Implement loading skeletons
- [ ] Optimize performance
- [ ] Add analytics tracking
- [ ] End-to-end testing

---

**Implementation Date**: 2025-10-22
**Status**: ✅ Ready for Frontend Development
**Estimated Development Time**: 4-5 weeks for full implementation
