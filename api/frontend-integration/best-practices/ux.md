# Best Practices: UX

## Loading States

```typescript
const EventDetails: React.FC<{ id: string }> = ({ id }) => {
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getById(id),
  });

  if (isLoading) {
    return <EventDetailsSkeleton />; // Skeleton loader
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return <EventDetailsView event={event!} />;
};
```

## Optimistic Updates

```typescript
const useTransferTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransferTicketRequest) => {
      const token = localStorage.getItem('accessToken')!;
      return ticketService.transfer(data, token);
    },
    onMutate: async (newTransfer) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tickets'] });

      // Snapshot previous value
      const previousTickets = queryClient.getQueryData(['tickets']);

      // Optimistically update
      queryClient.setQueryData(['tickets'], (old: Ticket[]) =>
        old.map((ticket) =>
          ticket.id === newTransfer.ticketId
            ? { ...ticket, status: 'transferred' as const }
            : ticket,
        ),
      );

      return { previousTickets };
    },
    onError: (err, newTransfer, context) => {
      // Rollback on error
      queryClient.setQueryData(['tickets'], context?.previousTickets);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
};
```

