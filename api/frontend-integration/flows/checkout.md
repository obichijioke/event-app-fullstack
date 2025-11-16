# Flow: Purchasing Tickets (Checkout)

```typescript
// services/order.service.ts
export class OrderService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async create(
    data: CreateOrderRequest,
    token: string
  ): Promise<Order> {
    return this.apiClient.post<Order>('/orders', data, token);
  }

  async getById(id: string, token: string): Promise<Order> {
    return this.apiClient.get<Order>(`/orders/${id}`, token);
  }

  async processPayment(
    orderId: string,
    data: {
      provider: 'stripe' | 'paystack';
      paymentMethodId: string;
    },
    token: string
  ): Promise<Order> {
    return this.apiClient.post<Order>(
      `/orders/${orderId}/payment/process`,
      data,
      token
    );
  }

  async listMyOrders(token: string): Promise<Order[]> {
    return this.apiClient.get<Order[]>('/orders', token);
  }
}

// Complete checkout flow component
const CheckoutFlow: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [step, setStep] = useState<'select' | 'review' | 'payment' | 'complete'>('select');
  const [selectedTickets, setSelectedTickets] = useState<{
    ticketTypeId: string;
    quantity: number;
    priceTierId?: string;
  }[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Select tickets
  const handleAddTicket = (ticketTypeId: string, quantity: number) => {
    setSelectedTickets([...selectedTickets, { ticketTypeId, quantity }]);
  };

  // Step 2: Create order
  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken')!;
      const newOrder = await orderService.create(
        {
          eventId,
          items: selectedTickets,
          promoCode: promoCode || undefined,
        },
        token
      );

      setOrder(newOrder);
      setStep('payment');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Process payment
  const handlePayment = async (paymentMethodId: string) => {
    if (!order) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken')!;
      const confirmedOrder = await orderService.processPayment(
        order.id,
        {
          provider: 'paystack', // or 'stripe'
          paymentMethodId,
        },
        token
      );

      setOrder(confirmedOrder);
      setStep('complete');
      toast.success('Payment successful! Check your email for tickets.');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-flow">
      {step === 'select' && (
        <TicketSelection
          eventId={eventId}
          onAddTicket={handleAddTicket}
          selectedTickets={selectedTickets}
          onNext={() => setStep('review')}
        />
      )}

      {step === 'review' && (
        <OrderReview
          selectedTickets={selectedTickets}
          promoCode={promoCode}
          onPromoCodeChange={setPromoCode}
          onBack={() => setStep('select')}
          onConfirm={handleCreateOrder}
          loading={loading}
        />
      )}

      {step === 'payment' && order && (
        <PaymentForm
          order={order}
          onPayment={handlePayment}
          loading={loading}
        />
      )}

      {step === 'complete' && order && (
        <OrderComplete order={order} />
      )}
    </div>
  );
};
```

