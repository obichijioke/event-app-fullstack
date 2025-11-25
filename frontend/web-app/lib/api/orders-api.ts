import { ApiClient } from './client';

const apiClient = new ApiClient();

export interface Order {
  id: string;
  userId: string;
  eventId: string;
  orgId: string;
  status: string;
  totalCents: bigint | number;
  subtotalCents: bigint | number;
  feesCents: bigint | number;
  discountCents: bigint | number;
  taxCents: bigint | number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  isFreeOrder?: boolean;
  event?: {
    id: string;
    title: string;
    startAt: string;
    venue?: {
      name: string;
      address?: {
        city: string;
        country: string;
      };
    };
  };
  items?: any[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const ordersApi = {
  getMyOrders: (params?: {
    status?: string;
    eventId?: string;
    orgId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<{ items: any[]; total: number; page: number; limit: number }>('/orders', params),
  
  getOrder: (orderId: string) => apiClient.get<Order>(`/orders/${orderId}`),
  
  createOrder: (data: {
    eventId: string;
    items: any[];
    promoCode?: string;
  }) => apiClient.post<Order>('/orders', data),
  
  initiatePayment: (orderId: string, data: {
    provider: string;
    returnUrl: string;
    cancelUrl: string;
  }) => apiClient.post<{ 
    paymentUrl: string; 
    paymentIntentId: string;
    clientSecret?: string;
    authorizationUrl?: string;
    reference?: string;
  }>(`/orders/${orderId}/payment`, data),
  
  processPayment: (data: {
    orderId: string;
    paymentIntentId: string;
  }) => apiClient.post<{ success: boolean }>(`/orders/${data.orderId}/payment/process`, data),
};
