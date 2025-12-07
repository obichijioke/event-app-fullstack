import apiClient from './client';
import type { Ticket, TicketTransfer, PaginatedResponse } from '../types';

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
    const response = await apiClient.get<PaginatedResponse<Ticket>>('/tickets', {
      params: filters,
    });
    return response.data;
  },

  // Get single ticket
  async getTicket(id: string): Promise<Ticket> {
    const response = await apiClient.get<Ticket>(`/tickets/${id}`);
    return response.data;
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
