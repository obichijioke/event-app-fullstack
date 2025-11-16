# Real-time: Polling for Updates

```typescript
// hooks/usePolling.ts
import { useEffect, useRef } from 'react';

export const usePolling = (
  callback: () => void,
  interval: number,
  enabled: boolean = true
) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, interval);

    return () => clearInterval(id);
  }, [interval, enabled]);
};

// Usage: Poll for ticket availability
const EventTickets: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [tickets, setTickets] = useState<TicketType[]>([]);

  const fetchTickets = async () => {
    const token = localStorage.getItem('accessToken')!;
    const data = await ticketingService.listTicketTypes(eventId, token);
    setTickets(data);
  };

  // Poll every 30 seconds
  usePolling(fetchTickets, 30000, true);

  useEffect(() => {
    fetchTickets();
  }, [eventId]);

  return (
    <div>
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
};
```

