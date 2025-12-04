"use client";

import { apiClient } from "@/lib/api-client";
import { buildQueryString } from "@/lib/utils/query-builder";

// Dispute Types
export interface Dispute {
  id: string;
  orderId: string;
  provider: "stripe" | "paystack";
  caseId: string;
  status: "needs_response" | "under_review" | "won" | "lost" | "warning" | "charge_refunded";
  amountCents: number | null;
  reason: string | null;
  openedAt: string;
  closedAt: string | null;
  respondByAt: string | null;
  submittedAt: string | null;
  responseNote: string | null;
  order: {
    id: string;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: string;
    buyer: {
      id: string;
      email: string;
      name: string | null;
    };
    event: {
      id: string;
      title: string;
      orgId: string;
    };
  };
  evidence: DisputeEvidence[];
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
    email: string;
    name: string | null;
  };
}

export interface DisputeStats {
  total: number;
  needs_response: number;
  under_review: number;
  won: number;
  lost: number;
  totalAmount: number;
  winRate: number;
}

export interface DisputeListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  provider?: string;
  startDate?: string;
  endDate?: string;
}

export interface DisputeListResponse {
  disputes: Dispute[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SubmitDisputeResponseDto {
  responseNote: string;
  evidenceUrls?: string[];
}

class OrganizerApiService {
  /**
   * Get all disputes for an organization
   */
  async getDisputes(orgId: string, params: DisputeListParams = {}): Promise<DisputeListResponse> {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<DisputeListResponse>(
      `/organizer/disputes?orgId=${orgId}${queryString ? `&${queryString}` : ""}`
    );
    return response;
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats(orgId: string): Promise<DisputeStats> {
    const response = await apiClient.get<DisputeStats>(
      `/organizer/disputes/stats?orgId=${orgId}`
    );
    return response;
  }

  /**
   * Get a single dispute by ID
   */
  async getDispute(orgId: string, disputeId: string): Promise<Dispute> {
    const response = await apiClient.get<Dispute>(
      `/organizer/disputes/${disputeId}?orgId=${orgId}`
    );
    return response;
  }

  /**
   * Submit response to a dispute
   */
  async submitDisputeResponse(
    orgId: string,
    disputeId: string,
    data: SubmitDisputeResponseDto
  ): Promise<Dispute> {
    const response = await apiClient.post<Dispute>(
      `/organizer/disputes/${disputeId}/respond?orgId=${orgId}`,
      data
    );
    return response;
  }

  /**
   * Upload evidence for a dispute
   */
  async uploadDisputeEvidence(
    orgId: string,
    disputeId: string,
    file: File
  ): Promise<DisputeEvidence> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.postFormData<DisputeEvidence>(
      `/organizer/disputes/${disputeId}/evidence?orgId=${orgId}`,
      formData
    );
    return response;
  }

  /**
   * Get all evidence for a dispute
   */
  async getDisputeEvidence(orgId: string, disputeId: string): Promise<DisputeEvidence[]> {
    const response = await apiClient.get<DisputeEvidence[]>(
      `/organizer/disputes/${disputeId}/evidence?orgId=${orgId}`
    );
    return response;
  }

  /**
   * Delete evidence
   */
  async deleteDisputeEvidence(
    orgId: string,
    disputeId: string,
    evidenceId: string
  ): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/organizer/disputes/${disputeId}/evidence/${evidenceId}?orgId=${orgId}`
    );
    return response;
  }
}

export const organizerApiService = new OrganizerApiService();
