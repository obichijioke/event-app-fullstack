import apiClient from './client';
import type {
  Order,
  CreateOrderRequest,
  PromoValidation,
  PaginatedResponse,
  Ticket,
} from '../types';
import { mapEventFromApi } from './events';

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  eventId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const centsToUnits = (value: unknown): number => {
  const num = toNumber(value);
  return num !== undefined ? num / 100 : 0;
};

const normalizeMeta = (
  payload: any,
  page = 1,
  limit = 20,
  fallbackTotal = 0
): PaginatedResponse<Order>['meta'] => {
  const total = payload?.total ?? fallbackTotal ?? 0;
  const metaLimit = payload?.limit ?? limit ?? fallbackTotal ?? 0;
  const metaPage = payload?.page ?? page ?? 1;
  const totalPages = metaLimit ? Math.ceil(total / metaLimit) : 1;
  return {
    total,
    page: metaPage,
    limit: metaLimit,
    totalPages,
  };
};

const mapTicketFromOrderApi = (ticket: any): Ticket => {
  const event = mapEventFromApi(ticket?.event || {});
  return {
    id: ticket?.id ?? '',
    ticketNumber: ticket?.ticketNumber ?? ticket?.id ?? '',
    status: ticket?.status ?? 'issued',
    qrCode: ticket?.qrCode ?? '',
    qrCodeUrl: ticket?.qrCodeUrl,
    ticketType: {
      id: ticket?.ticketType?.id ?? '',
      name: ticket?.ticketType?.name ?? '',
      description: ticket?.ticketType?.description,
      type: ticket?.ticketType?.kind === 'SEATED' ? 'SEATED' : 'GA',
      price: toNumber(ticket?.ticketType?.price) ?? 0,
      currency: ticket?.ticketType?.currency ?? 'USD',
      quantity: ticket?.ticketType?.capacity ?? 0,
      quantitySold: ticket?.ticketType?.sold ?? 0,
      quantityAvailable: ticket?.ticketType?.capacity ?? 0,
      maxPerOrder: ticket?.ticketType?.perOrderLimit ?? 0,
      minPerOrder: ticket?.ticketType?.minPerOrder ?? 1,
      saleStartDate: ticket?.ticketType?.salesStart,
      saleEndDate: ticket?.ticketType?.salesEnd,
      isOnSale: ticket?.ticketType?.status === 'active',
      eventId: ticket?.ticketType?.eventId ?? event.id,
    },
    ticketTypeId: ticket?.ticketTypeId ?? ticket?.ticketType?.id ?? '',
    event,
    eventId: event.id,
    order: undefined as any,
    orderId: ticket?.orderId ?? '',
    seat: ticket?.seat
      ? {
          section: ticket.seat.section ?? '',
          row: ticket.seat.row ?? '',
          number: ticket.seat.number ?? '',
        }
      : undefined,
    attendeeName: ticket?.attendeeName,
    attendeeEmail: ticket?.attendeeEmail,
    checkedInAt: ticket?.checkedInAt,
    transferredAt: ticket?.transferredAt,
    createdAt: ticket?.createdAt,
  };
};

const mapOrderFromApi = (raw: any): Order => {
  const subtotal = centsToUnits(raw?.subtotalCents ?? raw?.subtotal_cents);
  const fees = centsToUnits(raw?.feesCents ?? raw?.fees_cents);
  const tax = centsToUnits(raw?.taxCents ?? raw?.tax_cents);
  const total = centsToUnits(raw?.totalCents ?? raw?.total_cents ?? raw?.totalAmountCents);
  const discount =
    centsToUnits(raw?.discountCents ?? raw?.discount_cents) ||
    Math.max(subtotal + fees + tax - total, 0);

  const tickets = Array.isArray(raw?.tickets)
    ? raw.tickets.map(mapTicketFromOrderApi)
    : [];
  const event = mapEventFromApi(raw?.event || {});

  return {
    id: raw?.id ?? '',
    orderNumber: raw?.orderNumber ?? raw?.order_number ?? raw?.id ?? '',
    status: raw?.status ?? 'pending',
    totalAmount: total,
    subtotal,
    fees,
    discount,
    currency: raw?.currency ?? 'USD',
    paymentProvider: raw?.paymentProvider ?? raw?.payment_provider,
    paymentIntentId: raw?.paymentIntentId ?? raw?.payment_intent_id,
    event,
    eventId: raw?.eventId ?? raw?.event_id ?? event.id,
    tickets,
    items: Array.isArray(raw?.items) ? raw.items : [],
    promoCode: raw?.promoCode ?? raw?.promo_code,
    userId: raw?.buyerId ?? raw?.userId ?? raw?.user_id,
    createdAt: raw?.createdAt ?? raw?.created_at,
    paidAt: raw?.paidAt ?? raw?.paid_at,
  };
};

const normalizeOrdersList = (
  payload: any,
  page?: number,
  limit?: number
): PaginatedResponse<Order> => {
  if (Array.isArray(payload)) {
    return {
      data: payload.map(mapOrderFromApi),
      meta: normalizeMeta(undefined, page, limit, payload.length),
    };
  }

  const items = Array.isArray(payload?.items)
    ? payload.items.map(mapOrderFromApi)
    : Array.isArray(payload?.data)
      ? payload.data.map(mapOrderFromApi)
      : [];

  return {
    data: items,
    meta: normalizeMeta(payload, page, limit, items.length),
  };
};

export const ordersApi = {
  // Create new order
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', data);
    return mapOrderFromApi(response.data);
  },

  // Get all orders for current user
  async getOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get('/orders', {
      params: filters,
    });
    return normalizeOrdersList(response.data, filters?.page, filters?.limit);
  },

  // Get single order
  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get(`/orders/${id}`);
    return mapOrderFromApi(response.data);
  },

  // Cancel order
  async cancelOrder(id: string): Promise<void> {
    await apiClient.delete(`/orders/${id}`);
  },

  // Initiate payment
  async initiatePayment(
    orderId: string,
    provider: 'stripe' | 'paystack'
  ): Promise<PaymentIntentResponse> {
    const response = await apiClient.post<PaymentIntentResponse>(
      `/orders/${orderId}/payment`,
      { provider }
    );
    return response.data;
  },

  // Process payment (after client-side confirmation)
  async processPayment(
    orderId: string,
    paymentIntentId: string
  ): Promise<Order> {
    const response = await apiClient.post<Order>(
      `/orders/${orderId}/payment/process`,
      { paymentIntentId }
    );
    return response.data;
  },

  // Get available payment providers
  async getPaymentProviders(): Promise<{
    providers: { id: string; name: string; enabled: boolean }[];
  }> {
    const response = await apiClient.get('/orders/payment-providers');
    return response.data;
  },

  // Validate promo code
  async validatePromoCode(code: string, eventId: string): Promise<PromoValidation> {
    const response = await apiClient.post<PromoValidation>('/promotions/validate', {
      code,
      eventId,
    });
    return response.data;
  },

  // Request refund
  async requestRefund(orderId: string, reason: string): Promise<{ id: string; status: string }> {
    const response = await apiClient.post('/account/refunds', {
      orderId,
      reason,
    });
    return response.data;
  },

  // Get refund requests
  async getRefundRequests(): Promise<{
    id: string;
    orderId: string;
    reason: string;
    status: string;
    amount: number;
    createdAt: string;
  }[]> {
    const response = await apiClient.get('/account/refunds');
    return response.data;
  },
};
