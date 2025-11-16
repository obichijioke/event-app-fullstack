import { apiClient } from './client';
import type {
  CreateDraftRequest,
  DraftListItem,
  EventCreatorDraft,
  EventCreatorSectionType,
  EventCreatorTemplateSummary,
  PreviewLinkResponse,
  PublishDraftRequest,
  PublishDraftResponse,
  UpdateDraftSectionRequest,
} from '@/lib/types/event-creator-v2';

class EventCreatorV2Api {
  createDraft(payload: CreateDraftRequest) {
    return apiClient.post<EventCreatorDraft>('/creator-v2/drafts', payload);
  }

  listDrafts() {
    return apiClient.get<DraftListItem[]>('/creator-v2/drafts');
  }

  getDraft(draftId: string) {
    return apiClient.get<EventCreatorDraft>(`/creator-v2/drafts/${draftId}`);
  }

  updateSection(
    draftId: string,
    section: EventCreatorSectionType,
    payload: UpdateDraftSectionRequest,
  ) {
    return apiClient.put<EventCreatorDraft>(
      `/creator-v2/drafts/${draftId}/sections/${section}`,
      payload,
    );
  }

  generatePreview(draftId: string) {
    return apiClient.post<PreviewLinkResponse>(
      `/creator-v2/drafts/${draftId}/preview`,
    );
  }

  publishDraft(draftId: string, payload: PublishDraftRequest) {
    return apiClient.post<PublishDraftResponse>(
      `/creator-v2/drafts/${draftId}/publish`,
      payload,
    );
  }

  duplicateDraft(draftId: string) {
    return apiClient.post<EventCreatorDraft>(
      `/creator-v2/drafts/${draftId}/duplicate`,
    );
  }

  listTemplates(organizationId: string) {
    return apiClient.get<EventCreatorTemplateSummary[]>(
      '/creator-v2/templates',
      { orgId: organizationId },
    );
  }

  checkSlugAvailability(orgId: string, slug: string) {
    return apiClient.get<{ available: boolean; suggestions: string[] }>(
      '/creator-v2/slug/availability',
      { orgId, slug },
    );
  }

  async uploadCover(draftId: string, file: File): Promise<{ id: string; coverImageUrl: string }>
  {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const base = `${apiUrl}/api`;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${base}/creator-v2/drafts/${draftId}/cover`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    if (!res.ok) {
      throw new Error('Failed to upload cover');
    }
    return res.json();
  }

  listVersions(draftId: string) {
    return apiClient.get<Array<{ id: string; section?: string; reason?: string; createdAt: string; createdBy: string }>>(
      `/creator-v2/drafts/${draftId}/versions`,
    );
  }

  snapshot(draftId: string, body?: { section?: string; reason?: string }) {
    return apiClient.post<{ id: string; createdAt: string }>(
      `/creator-v2/drafts/${draftId}/snapshot`,
      body ?? {},
    );
  }

  restore(draftId: string, versionId: string) {
    return apiClient.post(`/creator-v2/drafts/${draftId}/restore/${versionId}`, {});
  }
}

export const eventCreatorV2Api = new EventCreatorV2Api();
