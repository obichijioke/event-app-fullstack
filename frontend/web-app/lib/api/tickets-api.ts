import { apiClient } from './client';

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  kind: 'GA' | 'SEATED';
  currency: string;
  priceCents: number;
  feeCents: number;
  capacity?: number;
  perOrderLimit?: number;
  salesStart?: string;
  salesEnd?: string;
  status: string;
  eventId: string;
  createdAt: string;
  updatedAt: string;
  priceTiers?: PriceTier[];
  _count?: {
    tickets?: number;
    holds?: number;
  };
}

export interface PriceTier {
  id: string;
  ticketTypeId: string;
  startsAt?: string;
  endsAt?: string;
  minQty: number;
  priceCents: number;
  feeCents: number;
}

export interface Ticket {
  id: string;
  orderId: string;
  eventId: string;
  occurrenceId?: string;
  ticketTypeId: string;
  seatId?: string;
  ownerId: string;
  status: 'issued' | 'transferred' | 'refunded' | 'checked_in' | 'void';
  qrCode: string;
  barcode: string;
  issuedAt: string;
  transferredAt?: string;
  refundedAt?: string;
  checkedInAt?: string;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
    startAt: string;
    venue?: {
      name: string;
      address?: {
        city: string;
        region: string;
      };
    };
  };
  ticketType?: {
    id: string;
    name: string;
    kind: string;
  };
  seat?: {
    id: string;
    section: string;
    row: string;
    number: string;
  };
}

export interface TransferRequest {
  ticketId: string;
  recipientEmail: string;
}

export const ticketsApi = {
  async getTicketTypes(eventId: string): Promise<TicketType[]> {
    return apiClient.get<TicketType[]>(`/ticketing/events/${eventId}/ticket-types`);
  },

  async getTicketType(id: string): Promise<TicketType> {
    return apiClient.get<TicketType>(`/ticketing/ticket-types/${id}`);
  },

  async getUserTickets(params?: {
    eventId?: string;
    status?: string;
    upcoming?: boolean;
  }): Promise<Ticket[]> {
    const queryParams = new URLSearchParams();
    if (params?.eventId) queryParams.set('eventId', params.eventId);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.upcoming !== undefined) queryParams.set('upcoming', params.upcoming.toString());

    const query = queryParams.toString();
    return apiClient.get<Ticket[]>(`/tickets${query ? `?${query}` : ''}`);
  },

  async getTicket(id: string): Promise<Ticket> {
    return apiClient.get<Ticket>(`/tickets/${id}`);
  },

  async initiateTransfer(data: TransferRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/tickets/transfer', data);
  },

  async acceptTransfer(transferId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/tickets/transfer/accept', { transferId });
  },

  async cancelTransfer(transferId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/tickets/transfer/${transferId}`);
  },

  async regenerateQRCode(ticketId: string): Promise<Ticket> {
    return apiClient.post<Ticket>(`/tickets/${ticketId}/regenerate-qr`, {});
  },

  async getMyHolds(eventId: string): Promise<Hold[]> {
    return apiClient.get<Hold[]>(`/ticketing/events/${eventId}/holds/my-holds`);
  },

  async createHold(eventId: string, data: CreateHoldDto): Promise<Hold> {
    return apiClient.post<Hold>(`/ticketing/events/${eventId}/holds`, data);
  },
};

export interface CreateHoldDto {
  ticketTypeId?: string;
  seatId?: string;
  occurrenceId?: string;
  quantity?: number;
  expiresAt: string;
  reason?: 'checkout' | 'reservation' | 'organizer_hold';
}

export interface Hold {
  id: string;
  eventId: string;
  ticketTypeId?: string;
  seatId?: string;
  occurrenceId?: string;
  userId?: string;
  reason: string;
  quantity: number;
  expiresAt: string;
  createdAt: string;
}
