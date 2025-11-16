# Feature: Geolocation (Nearby Events)

This feature lets users find public events near their location using event- or venue-level latitude/longitude.

Schema alignment:
- Event: `latitude` (Decimal), `longitude` (Decimal), indexed
- Venue: `latitude` (Decimal), `longitude` (Decimal), indexed

## API Design (frontend expectations)

- GET `/events/nearby?lat={number}&lng={number}&radiusKm={number}&page={n}&limit={n}`
  - Returns paginated public events ordered by distance
  - Each event may include distance (server-computed) and venue summary
- Optional: GET `/venues/nearby?lat={number}&lng={number}&radiusKm={number}`

If your API uses a different path, adjust the service accordingly.

## Types

```typescript
export interface Coordinates { latitude: number; longitude: number }
export interface EventWithDistance extends Event {
  distanceKm?: number;
}
```

## Service

```typescript
export class GeolocationService {
  constructor(private api = apiClient) {}

  async nearbyEvents(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<EventWithDistance>> {
    const search = new URLSearchParams({
      lat: String(params.latitude),
      lng: String(params.longitude),
      radiusKm: String(params.radiusKm ?? 50),
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    });
    return this.api.get(`/events/nearby?${search.toString()}`);
  }
}

export const geolocationService = new GeolocationService();
```

## Hooks

```typescript
export function useGeolocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<'prompt'|'granted'|'denied'|'loading'>('prompt');
  const [error, setError] = useState<string|null>(null);

  const request = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStatus('granted');
      },
      (err) => { setError(err.message); setStatus('denied'); },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return { coords, status, error, request };
}

export function useNearbyEvents(coords: Coordinates | null, radiusKm = 50) {
  return useQuery({
    queryKey: ['nearby-events', coords, radiusKm],
    enabled: !!coords,
    queryFn: () => geolocationService.nearbyEvents({
      latitude: coords!.latitude,
      longitude: coords!.longitude,
      radiusKm,
    }),
  });
}
```

## UI

- Add “Use my location” CTA on the Events Explore page
- Show a map or list sorted by distance; display `distanceKm` if available
- Filter by radius (10–200km)

## Data Entry (organizers)

- Venue creation form: add `latitude` and `longitude` fields
- Event editor: allow setting `latitude`/`longitude` when no venue is specified

```typescript
// Example: event editor save payload additions
const payload: Partial<Event> = {
  ...baseFields,
  latitude: lat || undefined,
  longitude: lng || undefined,
};
```
