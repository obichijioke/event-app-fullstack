import { apiClient } from './client';

export interface Order {
  id: string;
  buyerId: string;
  orgId: string;
  eventId: string;
  occurrenceId?: string;
  status: 'pending' | 'paid' | 'canceled' | 'refunded' | 'chargeback';
  subtotalCents: number;
  feesCents: number;
  taxCents: number;
  totalCents: number;
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
      address: any;
    };
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  ticketTypeId: string;
  seatId?: string;
  quantity: number;
  unitPriceCents: number;
  unitFeeCents: number;
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

  async initiatePayment(orderId: string, data: CreatePaymentDto): Promise<{
    clientSecret?: string;
    authorizationUrl?: string;
    providerIntent?: string;
    payment?: any;
  }> {
    return apiClient.post(`/orders/${orderId}/payment`, data);
  },

  async processPayment(data: ProcessPaymentDto): Promise<any> {
    return apiClient.post(
      `/orders/${data.orderId}/payment/process`,
      data,
    );
  },
};
