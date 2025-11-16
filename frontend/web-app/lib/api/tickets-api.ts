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
    tickets: number;
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

export const ticketsApi = {
  async getTicketTypes(eventId: string): Promise<TicketType[]> {
    return apiClient.get<TicketType[]>(`/ticketing/events/${eventId}/ticket-types`);
  },

  async getTicketType(id: string): Promise<TicketType> {
    return apiClient.get<TicketType>(`/ticketing/ticket-types/${id}`);
  },
};
