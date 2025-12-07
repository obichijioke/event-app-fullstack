import apiClient from './client';
import type {
  Order,
  CreateOrderRequest,
  PromoValidation,
  PaginatedResponse,
} from '../types';

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

export const ordersApi = {
  // Create new order
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  },

  // Get all orders for current user
  async getOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get<PaginatedResponse<Order>>('/orders', {
      params: filters,
    });
    return response.data;
  },

  // Get single order
  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
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
