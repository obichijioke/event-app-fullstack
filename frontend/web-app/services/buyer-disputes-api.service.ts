// Buyer Disputes API Service
import { apiClient } from '@/lib/api/client';

export interface DisputeCategory {
  duplicate_charge: 'Duplicate Charge';
  tickets_not_delivered: 'Tickets Not Delivered';
  wrong_ticket_type: 'Wrong Ticket Type';
  refund_not_processed: 'Refund Not Processed';
  partial_refund_issue: 'Partial Refund Issue';
  event_mismatch: 'Event Mismatch';
  venue_changed: 'Venue Changed';
  time_changed: 'Time Changed';
  unauthorized_purchase: 'Unauthorized Purchase';
  counterfeit_tickets: 'Counterfeit Tickets';
  account_compromise: 'Account Compromise';
  other: 'Other';
}

export const DISPUTE_CATEGORIES: Record<keyof DisputeCategory, string> = {
  duplicate_charge: 'Duplicate Charge',
  tickets_not_delivered: 'Tickets Not Delivered',
  wrong_ticket_type: 'Wrong Ticket Type',
  refund_not_processed: 'Refund Not Processed',
  partial_refund_issue: 'Partial Refund Issue',
  event_mismatch: 'Event Mismatch',
  venue_changed: 'Venue Changed',
  time_changed: 'Time Changed',
  unauthorized_purchase: 'Unauthorized Purchase',
  counterfeit_tickets: 'Counterfeit Tickets',
  account_compromise: 'Account Compromise',
  other: 'Other',
};

export interface CreateDisputeDto {
  orderId: string;
  category: keyof DisputeCategory;
  subcategory?: string;
  description: string;
  evidenceUrls?: string[];
}

export interface AddMessageDto {
  message: string;
}

export interface AppealDisputeDto {
  appealNote: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  type: 'payment_provider' | 'platform';
  initiatorId: string;
  category: keyof DisputeCategory;
  subcategory?: string;
  description: string;
  status: string;
  resolution: string;
  resolutionNote?: string;
  amountCents: number;
  refundedCents?: number;
  reason?: string;
  openedAt: string;
  closedAt?: string;
  respondByAt?: string;
  submittedAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  responseNote?: string;
  moderatorNote?: string;
  moderatorId?: string;
  appealedAt?: string;
  appealNote?: string;
  appealedBy?: string;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    totalCents: number;
    currency: string;
    event: {
      id: string;
      title: string;
    };
  };
  initiator?: {
    id: string;
    name: string;
    email: string;
  };
  evidence: DisputeEvidence[];
  messages: DisputeMessage[];
  _count?: {
    messages: number;
  };
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderRole: 'buyer' | 'organizer' | 'moderator' | 'admin';
  message: string;
  isInternal: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DisputeListResponse {
  disputes: Dispute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

class BuyerDisputesApiService {
  /**
   * Create a new dispute
   */
  async createDispute(data: CreateDisputeDto): Promise<Dispute> {
    return apiClient.post<Dispute>('/buyer/disputes', data);
  }

  /**
   * Get list of my disputes
   */
  async getDisputes(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: keyof DisputeCategory;
    search?: string;
  }): Promise<DisputeListResponse> {
    return apiClient.get<DisputeListResponse>('/buyer/disputes', params);
  }

  /**
   * Get single dispute details
   */
  async getDispute(disputeId: string): Promise<Dispute> {
    return apiClient.get<Dispute>(`/buyer/disputes/${disputeId}`);
  }

  /**
   * Add a message to dispute thread
   */
  async addMessage(
    disputeId: string,
    data: AddMessageDto
  ): Promise<DisputeMessage> {
    return apiClient.post<DisputeMessage>(
      `/buyer/disputes/${disputeId}/messages`,
      data
    );
  }

  /**
   * Upload evidence file
   */
  async uploadEvidence(
    disputeId: string,
    file: File
  ): Promise<DisputeEvidence> {
    return apiClient.upload<DisputeEvidence>(
      `/buyer/disputes/${disputeId}/evidence`,
      file,
    );
  }

  /**
   * Appeal a dispute decision
   */
  async appealDispute(
    disputeId: string,
    data: AppealDisputeDto
  ): Promise<Dispute> {
    return apiClient.post<Dispute>(
      `/buyer/disputes/${disputeId}/appeal`,
      data
    );
  }

  /**
   * Get my orders (for dispute creation wizard)
   */
  async getMyOrders(): Promise<any[]> {
    const response = await apiClient.get<{ items?: any[] }>(
      '/orders',
      { limit: 100 }
    );
    return response?.items || [];
  }
}

export const buyerDisputesApi = new BuyerDisputesApiService();
