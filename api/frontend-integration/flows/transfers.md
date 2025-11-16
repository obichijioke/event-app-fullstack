# Flow: Ticket Transfers

```typescript
// services/ticket.service.ts
export class TicketService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async listMyTickets(token: string): Promise<Ticket[]> {
    return this.apiClient.get<Ticket[]>('/tickets', token);
  }

  async getById(id: string, token: string): Promise<Ticket> {
    return this.apiClient.get<Ticket>(`/tickets/${id}`, token);
  }

  async transfer(
    data: {
      ticketId: string;
      recipientEmail: string;
      message?: string;
    },
    token: string
  ): Promise<TicketTransfer> {
    return this.apiClient.post<TicketTransfer>(
      '/tickets/transfer',
      data,
      token
    );
  }

  async acceptTransfer(
    transferId: string,
    token: string
  ): Promise<TicketTransfer> {
    return this.apiClient.post<TicketTransfer>(
      '/tickets/transfer/accept',
      { transferId },
      token
    );
  }

  async cancelTransfer(
    transferId: string,
    token: string
  ): Promise<void> {
    return this.apiClient.delete<void>(
      `/tickets/transfer/${transferId}`,
      token
    );
  }
}

// Transfer ticket component
const TransferTicketForm: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken')!;
      await ticketService.transfer(
        {
          ticketId: ticket.id,
          recipientEmail,
          message,
        },
        token
      );

      toast.success('Transfer initiated! Recipient will receive an email.');
      navigate('/tickets');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleTransfer}>
      <h3>Transfer Ticket</h3>

      <div>
        <label>Recipient Email</label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a personal message..."
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Transferring...' : 'Transfer Ticket'}
      </button>
    </form>
  );
};
```

