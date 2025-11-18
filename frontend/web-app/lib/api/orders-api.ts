import { ApiClient } from './client';

const apiClient = new ApiClient();

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
};
