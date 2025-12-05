// Organizer Disputes API Service
import { apiClient } from '@/lib/api/client';

export interface OrganizerDispute {
  id: string;
  orderId: string;
  type: 'payment_provider' | 'platform';
  initiatorId: string;
  category?: string;
  subcategory?: string;
  description?: string;
  status: string;
  resolution: string;
  resolutionNote?: string;
  amountCents: number;
  refundedCents?: number;
  respondByAt?: string;
  submittedAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  responseNote?: string;
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
  evidence?: any[];
  messages?: any[];
  _count?: {
    messages: number;
  };
}

export interface DisputeStats {
  total: number;
  open: number;
  resolved: number;
  escalated: number;
  needsResponse: number;
  urgent: number;
}

export interface RespondToPlatformDisputeDto {
  responseNote: string;
  proposedResolution?: string;
  proposedRefundCents?: number;
}

export interface ProposeResolutionDto {
  resolution: string;
  refundAmountCents?: number;
  proposalNote: string;
}

class OrganizerDisputesApiService {
  /**
   * Get dispute statistics for an organization
   */
  async getStats(orgId: string): Promise<DisputeStats> {
    return apiClient.get<DisputeStats>('/organizer/disputes/stats', { orgId });
  }

  /**
   * Get all payment provider disputes
   */
  async getPaymentProviderDisputes(orgId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<any> {
    return apiClient.get<any>('/organizer/disputes', { orgId, ...params });
  }

  /**
   * Get single payment provider dispute
   */
  async getPaymentProviderDispute(orgId: string, disputeId: string): Promise<OrganizerDispute> {
    return apiClient.get<OrganizerDispute>(
      `/organizer/disputes/${disputeId}`,
      { orgId }
    );
  }

  /**
   * Get all platform disputes
   */
  async getPlatformDisputes(orgId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
    urgentOnly?: boolean;
  }): Promise<any> {
    return apiClient.get<any>(
      '/organizer/disputes/platform/list',
      { orgId, ...params }
    );
  }

  /**
   * Get single platform dispute
   */
  async getPlatformDispute(orgId: string, disputeId: string): Promise<OrganizerDispute> {
    return apiClient.get<OrganizerDispute>(
      `/organizer/disputes/platform/${disputeId}`,
      { orgId }
    );
  }

  /**
   * Respond to a platform dispute
   */
  async respondToPlatformDispute(
    orgId: string,
    disputeId: string,
    data: RespondToPlatformDisputeDto
  ): Promise<OrganizerDispute> {
    return apiClient.post<OrganizerDispute>(
      `/organizer/disputes/platform/${disputeId}/respond`,
      data,
      { orgId }
    );
  }

  /**
   * Propose a resolution to the buyer
   */
  async proposeResolution(
    orgId: string,
    disputeId: string,
    data: ProposeResolutionDto
  ): Promise<OrganizerDispute> {
    return apiClient.post<OrganizerDispute>(
      `/organizer/disputes/platform/${disputeId}/propose-resolution`,
      data,
      { orgId }
    );
  }

  /**
   * Accept moderator's resolution
   */
  async acceptResolution(orgId: string, disputeId: string): Promise<OrganizerDispute> {
    return apiClient.post<OrganizerDispute>(
      `/organizer/disputes/platform/${disputeId}/accept`,
      {},
      { orgId }
    );
  }

  /**
   * Upload evidence for a dispute
   */
  async uploadEvidence(
    orgId: string,
    disputeId: string,
    file: File
  ): Promise<any> {
    const endpoint = `/organizer/disputes/${disputeId}/evidence?orgId=${encodeURIComponent(orgId)}`;
    return apiClient.upload<any>(endpoint, file);
  }

  /**
   * Get all evidence for a dispute
   */
  async getEvidence(orgId: string, disputeId: string): Promise<any[]> {
    return apiClient.get<any[]>(
      `/organizer/disputes/${disputeId}/evidence`,
      { orgId }
    );
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(
    orgId: string,
    disputeId: string,
    evidenceId: string
  ): Promise<void> {
    await apiClient.delete(
      `/organizer/disputes/${disputeId}/evidence/${evidenceId}`,
      { orgId }
    );
  }

  /**
   * Submit response to payment provider dispute
   */
  async submitResponse(
    orgId: string,
    disputeId: string,
    data: any
  ): Promise<OrganizerDispute> {
    return apiClient.post<OrganizerDispute>(
      `/organizer/disputes/${disputeId}/respond`,
      data,
      { orgId }
    );
  }
}

export const organizerDisputesApi = new OrganizerDisputesApiService();
