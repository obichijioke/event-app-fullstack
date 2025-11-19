import { ApiClient } from './client';

const apiClient = new ApiClient();

export interface AccountStats {
  totalOrders: number;
  totalSpentCents: number;
  activeTickets: number;
  following: number;
}

export interface Transfer {
  id: string;
  ticketId: string;
  direction: 'sent' | 'received';
  status: 'pending' | 'accepted' | 'canceled';
  initiatedAt: string;
  acceptedAt: string | null;
  canceledAt: string | null;
  ticket: {
    id: string;
    event: {
      id: string;
      title: string;
      startAt: string;
    };
    ticketType: {
      id: string;
      name: string;
      kind: string;
    };
  };
  fromUser: {
    id: string;
    email: string;
    name: string | null;
  };
  toUser: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface Refund {
  id: string;
  orderId: string;
  amountCents: bigint;
  currency: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'processed' | 'failed' | 'canceled';
  createdAt: string;
  processedAt: string | null;
  order: {
    id: string;
    totalCents: bigint;
    currency: string;
    status: string;
    createdAt: string;
    eventId: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const accountApi = {
  getStats: () =>
    apiClient.get<AccountStats>('/account/stats'),

  getTransfers: (params?: {
    type?: 'sent' | 'received' | 'all';
    status?: 'pending' | 'accepted' | 'canceled';
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.set('type', params.type);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get<PaginatedResponse<Transfer>>(
      `/account/transfers${query ? `?${query}` : ''}`
    );
  },

  getRefunds: (params?: {
    status?: 'pending' | 'approved' | 'processed' | 'failed' | 'canceled';
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get<PaginatedResponse<Refund>>(
      `/account/refunds${query ? `?${query}` : ''}`
    );
  },

  requestRefund: (data: {
    orderId: string;
    reason: string;
    amountCents?: number;
  }) =>
    apiClient.post<Refund>('/account/refunds', data),
};
