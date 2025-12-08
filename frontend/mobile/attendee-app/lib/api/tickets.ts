import apiClient from './client';
import type { Ticket, TicketTransfer, PaginatedResponse } from '../types';
import { mapEventFromApi } from './events';

const normalizeMeta = (
  payload: any,
  page = 1,
  limit = 20,
  fallbackTotal = 0
): PaginatedResponse<Ticket>['meta'] => {
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

const mapTicket = (raw: any): Ticket => {
  const event = mapEventFromApi(raw?.event || {});
  return {
    id: raw?.id ?? '',
    ticketNumber: raw?.ticketNumber ?? raw?.id ?? '',
    status: raw?.status ?? 'issued',
    qrCode: raw?.qrCode ?? '',
    qrCodeUrl: raw?.qrCodeUrl,
    ticketType: {
      id: raw?.ticketType?.id ?? '',
      name: raw?.ticketType?.name ?? '',
      description: raw?.ticketType?.description,
      type: raw?.ticketType?.kind === 'SEATED' ? 'SEATED' : 'GA',
      price: 0,
      currency: raw?.ticketType?.currency ?? 'USD',
      quantity: raw?.ticketType?.capacity ?? 0,
      quantitySold: raw?.ticketType?.sold ?? 0,
      quantityAvailable: raw?.ticketType?.capacity ?? 0,
      maxPerOrder: raw?.ticketType?.perOrderLimit ?? 0,
      minPerOrder: raw?.ticketType?.minPerOrder ?? 1,
      saleStartDate: raw?.ticketType?.salesStart,
      saleEndDate: raw?.ticketType?.salesEnd,
      isOnSale: raw?.ticketType?.status === 'active',
      eventId: raw?.ticketType?.eventId ?? event.id,
    },
    ticketTypeId: raw?.ticketTypeId ?? raw?.ticketType?.id ?? '',
    event,
    eventId: raw?.eventId ?? event.id,
    order: undefined as any,
    orderId: raw?.orderId ?? '',
    seat: raw?.seat
      ? {
          section: raw.seat.section ?? '',
          row: raw.seat.row ?? '',
          number: raw.seat.number ?? '',
        }
      : undefined,
    attendeeName: raw?.attendeeName,
    attendeeEmail: raw?.attendeeEmail,
    checkedInAt: raw?.checkedInAt,
    transferredAt: raw?.transferredAt,
    createdAt: raw?.createdAt,
  };
};

const normalizeTicketsList = (
  payload: any,
  page?: number,
  limit?: number
): PaginatedResponse<Ticket> => {
  if (Array.isArray(payload)) {
    return {
      data: payload.map(mapTicket),
      meta: normalizeMeta(undefined, page, limit, payload.length),
    };
  }

  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  const mapped = items.map(mapTicket);

  return {
    data: mapped,
    meta: normalizeMeta(payload, page, limit, mapped.length),
  };
};

export interface TicketFilters {
  page?: number;
  limit?: number;
  eventId?: string;
  status?: string;
  upcoming?: boolean;
}

export interface TransferRequest {
  ticketId: string;
  recipientEmail: string;
  recipientName?: string;
}

export const ticketsApi = {
  // Get all tickets for current user
  async getTickets(filters?: TicketFilters): Promise<PaginatedResponse<Ticket>> {
    const response = await apiClient.get('/tickets', {
      params: filters,
    });
    return normalizeTicketsList(response.data, filters?.page, filters?.limit);
  },

  // Get single ticket
  async getTicket(id: string): Promise<Ticket> {
    const response = await apiClient.get(`/tickets/${id}`);
    return mapTicket(response.data);
  },

  // Initiate ticket transfer
  async transferTicket(data: TransferRequest): Promise<TicketTransfer> {
    const response = await apiClient.post<TicketTransfer>('/tickets/transfer', data);
    return response.data;
  },

  // Accept transfer (for recipient)
  async acceptTransfer(transferId: string): Promise<Ticket> {
    const response = await apiClient.post<Ticket>('/tickets/transfer/accept', {
      transferId,
    });
    return response.data;
  },

  // Cancel transfer
  async cancelTransfer(transferId: string): Promise<void> {
    await apiClient.delete(`/tickets/transfer/${transferId}`);
  },

  // Get transfers for a ticket
  async getTicketTransfers(ticketId: string): Promise<TicketTransfer[]> {
    const response = await apiClient.get<TicketTransfer[]>(`/tickets/${ticketId}/transfers`);
    return response.data;
  },

  // Regenerate QR code
  async regenerateQR(ticketId: string): Promise<{ qrCode: string; qrCodeUrl: string }> {
    const response = await apiClient.post<{ qrCode: string; qrCodeUrl: string }>(
      `/tickets/${ticketId}/regenerate-qr`
    );
    return response.data;
  },

  // Get ticket statistics (for organizers)
  async getEventTicketStats(eventId: string): Promise<{
    total: number;
    sold: number;
    checkedIn: number;
    transferred: number;
    refunded: number;
  }> {
    const response = await apiClient.get(`/tickets/events/${eventId}/stats`);
    return response.data;
  },
};
