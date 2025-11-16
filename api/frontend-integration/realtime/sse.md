# Real-time: Server-Sent Events (SSE)

```typescript
// hooks/useSSE.ts
import { useEffect, useState } from 'react';

export const useSSE = <T>(url: string, enabled: boolean = true) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (err) {
        setError(err as Error);
      }
    };

    eventSource.onerror = (err) => {
      setError(new Error('SSE connection error'));
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [url, enabled]);

  return { data, error };
};

// Usage: Real-time ticket availability
const LiveTicketAvailability: React.FC<{ eventId: string }> = ({ eventId }) => {
  const token = localStorage.getItem('accessToken')!;
  const { data: availability } = useSSE<{ available: number }>(
    `${BASE_URL}/events/${eventId}/availability/stream?token=${token}`,
    true
  );

  return (
    <div>
      <h3>Available Tickets</h3>
      <p>{availability?.available ?? 'Loading...'}</p>
    </div>
  );
};
```

