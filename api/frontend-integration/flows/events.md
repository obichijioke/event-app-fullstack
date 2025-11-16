# Flow: Creating and Publishing Events

```typescript
// services/event.service.ts
export class EventService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(
    orgId: string,
    data: CreateEventRequest,
    token: string,
  ): Promise<Event> {
    return this.apiClient.post<Event>(`/events/org/${orgId}`, data, token);
  }

  async listPublic(filters?: {
    status?: string;
    categoryId?: string;
    upcoming?: boolean;
    search?: string;
  }): Promise<Event[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.upcoming) params.append('upcoming', 'true');
    if (filters?.search) params.append('search', filters.search);

    return this.apiClient.get<Event[]>(`/events?${params.toString()}`);
  }

  async getById(id: string): Promise<Event> {
    return this.apiClient.get<Event>(`/events/${id}`);
  }

  async update(
    id: string,
    data: Partial<CreateEventRequest>,
    token: string,
  ): Promise<Event> {
    return this.apiClient.patch<Event>(`/events/${id}`, data, token);
  }

  async addOccurrence(
    eventId: string,
    data: {
      startsAt: string;
      endsAt: string;
      doorsOpenAt?: string;
    },
    token: string,
  ): Promise<EventOccurrence> {
    return this.apiClient.post<EventOccurrence>(
      `/events/${eventId}/occurrences`,
      data,
      token,
    );
  }

  async addAsset(
    eventId: string,
    data: {
      kind: 'image' | 'pdf' | 'video' | 'seatmap-render';
      url: string;
      altText?: string;
    },
    token: string,
  ): Promise<EventAsset> {
    return this.apiClient.post<EventAsset>(
      `/events/${eventId}/assets`,
      data,
      token,
    );
  }
}
```

