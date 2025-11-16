# Feature: Following Organizers

Users can follow organizations to receive updates and quickly browse events from followed organizers.

Schema alignment:
- `UserFollow`: `userId`, `organizationId`, unique per pair
- `Organization.followers`: back-reference, counts can be summarized

## API Design (frontend expectations)

- POST `/organizations/:orgId/follow`
- DELETE `/organizations/:orgId/follow`
- GET `/me/following` — list of organizations the user follows
- GET `/organizations/:orgId/followers` — follower count and sample list

If your API uses different routes, adapt the service accordingly.

## Types

```typescript
export interface UserFollow {
  id: string;
  userId: string;
  organizationId: string;
  createdAt: string;
}
```

## Service

```typescript
export class FollowService {
  constructor(private api = apiClient) {}

  async follow(orgId: string, token: string): Promise<UserFollow> {
    return this.api.post<UserFollow>(`/organizations/${orgId}/follow`, {}, token);
  }

  async unfollow(orgId: string, token: string): Promise<void> {
    return this.api.delete<void>(`/organizations/${orgId}/follow`, token);
  }

  async myFollowing(token: string): Promise<Organization[]> {
    return this.api.get<Organization[]>(`/me/following`, token);
  }

  async followers(orgId: string): Promise<{ count: number; users: User[] }>{
    return this.api.get<{ count: number; users: User[] }>(`/organizations/${orgId}/followers`);
  }
}

export const followService = new FollowService();
```

## UI Patterns

- Organization header: Follow/Unfollow button with optimistic update
- Organizer page: Follower count and list preview
- Home/Feed: Section for “From organizers you follow”

## Example (React)

```typescript
const FollowButton: React.FC<{ org: Organization }> = ({ org }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Optionally prefetch follow state from `/me/following`
  }, [org.id]);

  const toggle = async () => {
    const token = localStorage.getItem('accessToken')!;
    setLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollow(org.id, token);
        setIsFollowing(false);
      } else {
        await followService.follow(org.id, token);
        setIsFollowing(true);
      }
    } catch (e) {
      toast.error(handleApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={toggle} disabled={loading}>
      {isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
};
```

## Query Examples (React Query)

```typescript
const useMyFollowing = () => {
  const token = localStorage.getItem('accessToken')!;
  return useQuery({
    queryKey: ['my-following'],
    queryFn: () => followService.myFollowing(token),
    staleTime: 60_000,
  });
};
```

