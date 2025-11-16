# Real-time: Webhook Integration (Organizers)

```typescript
// services/webhook.service.ts
export class WebhookService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(
    orgId: string,
    data: {
      url: string;
      events: string[];
      secret: string;
    },
    token: string
  ): Promise<Webhook> {
    return this.apiClient.post<Webhook>(
      `/webhooks/orgs/${orgId}/webhooks`,
      data,
      token
    );
  }

  async list(orgId: string, token: string): Promise<Webhook[]> {
    return this.apiClient.get<Webhook[]>(
      `/webhooks/orgs/${orgId}/webhooks`,
      token
    );
  }

  async getEvents(
    orgId: string,
    webhookId: string,
    token: string
  ): Promise<WebhookEvent[]> {
    return this.apiClient.get<WebhookEvent[]>(
      `/webhooks/orgs/${orgId}/webhooks/${webhookId}/events`,
      token
    );
  }

  async retry(
    orgId: string,
    webhookId: string,
    eventId: string,
    token: string
  ): Promise<void> {
    return this.apiClient.post<void>(
      `/webhooks/orgs/${orgId}/webhooks/${webhookId}/events/${eventId}/retry`,
      {},
      token
    );
  }
}

// Component for managing webhooks
const WebhookManager: React.FC<{ orgId: string }> = ({ orgId }) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
    secret: '',
  });

  const handleCreate = async () => {
    const token = localStorage.getItem('accessToken')!;
    const webhook = await webhookService.create(orgId, newWebhook, token);
    setWebhooks([...webhooks, webhook]);
    toast.success('Webhook created successfully!');
  };

  return (
    <div>
      <h2>Webhooks</h2>

      <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
        <input
          type="url"
          value={newWebhook.url}
          onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
          placeholder="Webhook URL"
          required
        />

        <select
          multiple
          value={newWebhook.events}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, opt => opt.value);
            setNewWebhook({ ...newWebhook, events: selected });
          }}
        >
          <option value="order.created">Order Created</option>
          <option value="order.confirmed">Order Confirmed</option>
          <option value="ticket.transferred">Ticket Transferred</option>
          <option value="ticket.checkedin">Ticket Checked In</option>
        </select>

        <input
          type="password"
          value={newWebhook.secret}
          onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
          placeholder="Webhook Secret"
          required
        />

        <button type="submit">Create Webhook</button>
      </form>

      <div className="webhook-list">
        {webhooks.map((webhook) => (
          <WebhookCard key={webhook.id} webhook={webhook} />
        ))}
      </div>
    </div>
  );
};
```

