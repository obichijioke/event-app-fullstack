import { apiClient } from './client';

export interface Order {
  id: string;
  buyerId: string;
  orgId: string;
  eventId: string;
  occurrenceId?: string;
  status: 'pending' | 'paid' | 'canceled' | 'refunded' | 'chargeback';
  subtotalCents: bigint; // Changed from number to bigint to match Prisma schema
  feesCents: bigint; // Changed from number to bigint to match Prisma schema
  taxCents: bigint; // Changed from number to bigint to match Prisma schema
  totalCents: bigint; // Changed from number to bigint to match Prisma schema
  currency: string;
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  canceledAt?: string;
  items?: OrderItem[];
  event?: {
    id: string;
    title: string;
    startTime: string;
    bannerImageUrl?: string;
    venue?: {
      name: string;
      address?: Record<string, unknown>;
    };
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  ticketTypeId: string;
  seatId?: string;
  quantity: number;
  unitPriceCents: bigint; // Changed from number to bigint to match Prisma schema
  unitFeeCents: bigint; // Changed from number to bigint to match Prisma schema
  currency: string;
}

export interface CreateOrderDto {
  eventId: string;
  occurrenceId?: string;
  items: {
    ticketTypeId: string;
    seatId?: string;
    quantity: number;
  }[];
}

export interface CreatePaymentDto {
  provider: 'stripe' | 'paystack' | 'test';
  paymentMethodId?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface ProcessPaymentDto {
  orderId: string;
  paymentIntentId?: string;
  paymentMethodId?: string;
}

export interface PaymentResponse {
  clientSecret?: string;
  authorizationUrl?: string;
  providerIntent?: string;
  reference?: string;
  payment?: Record<string, unknown>;
}

export interface ProcessPaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export const ordersApi = {
  async createOrder(data: CreateOrderDto): Promise<Order> {
    return apiClient.post<Order>('/orders', data);
  },

  async getOrder(id: string): Promise<Order> {
    return apiClient.get<Order>(`/orders/${id}`);
  },

  async getOrders(params?: {
    status?: string;
    eventId?: string;
  }): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders', params);
  },

  async cancelOrder(id: string): Promise<Order> {
    return apiClient.delete<Order>(`/orders/${id}`);
  },

  async initiatePayment(orderId: string, data: CreatePaymentDto): Promise<PaymentResponse> {
    return apiClient.post<PaymentResponse>(`/orders/${orderId}/payment`, data);
  },

  async processPayment(data: ProcessPaymentDto): Promise<ProcessPaymentResponse> {
    return apiClient.post<ProcessPaymentResponse>(
      `/orders/${data.orderId}/payment/process`,
      data,
    );
  },
};
