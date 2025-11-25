export type EventCreatorSectionType =
  | 'basics'
  | 'story'
  | 'tickets'
  | 'schedule'
  | 'checkout';

export const EVENT_CREATOR_SECTION_ORDER: EventCreatorSectionType[] = [
  'basics',
  'story',
  'tickets',
  'schedule',
  'checkout',
];

export type EventCreatorSectionStatus = 'incomplete' | 'valid' | 'blocked';

export type EventCreatorDraftStatus =
  | 'draft'
  | 'ready'
  | 'scheduled'
  | 'published'
  | 'archived';

export type EventCreatorEventType = 'in_person' | 'online' | 'hybrid';

export interface EventCreatorDraftSection {
  section: EventCreatorSectionType;
  payload: Record<string, any>;
  status: EventCreatorSectionStatus;
  errors: Record<string, any>[];
  updatedAt: string;
  completedAt: string | null;
}

export interface EventCreatorCollaborator {
  userId: string;
  role: 'owner' | 'editor' | 'finance' | 'check_in';
}

export interface EventCreatorDraft {
  id: string;
  organization: {
    id: string;
    name: string;
  };
  status: EventCreatorDraftStatus;
  title: string | null;
  completionPercent: number;
  visibility: 'public' | 'unlisted' | 'private';
  timezone: string;
  eventType: EventCreatorEventType;
  activeSection: EventCreatorSectionType;
  lastAutosavedAt?: string | null;
  previewToken?: string | null;
  previewTokenExpiresAt?: string | null;
  targetPublishAt?: string | null;
  collaborators: EventCreatorCollaborator[];
  sections: EventCreatorDraftSection[];
}

export interface DraftListItem {
  id: string;
  organization: {
    id: string;
    name: string;
  };
  status: EventCreatorDraftStatus;
  title: string | null;
  completionPercent: number;
  updatedAt: string;
  sections: Array<{
    section: EventCreatorSectionType;
    status: EventCreatorSectionStatus;
    updatedAt: string;
  }>;
}

export interface CreateDraftRequest {
  organizationId: string;
  eventType: EventCreatorEventType;
  timezone: string;
  templateId?: string;
  sourceEventId?: string;
  title?: string;
}

export interface UpdateDraftSectionRequest {
  payload: Record<string, any>;
  status?: EventCreatorSectionStatus;
  errors?: Record<string, any>[];
  autosave?: boolean;
}

export interface PublishDraftRequest {
  publishAt?: string;
  visibility?: 'public' | 'unlisted' | 'private';
  sendNotifications?: boolean;
  autoApproveTickets?: boolean;
  notes?: string;
}

export interface PublishDraftResponse {
  id: string;
  eventId?: string;
  status: EventCreatorDraftStatus;
  targetPublishAt?: string | null;
  message: string;
}

export interface PreviewLinkResponse {
  id: string;
  previewToken: string;
  previewTokenExpiresAt: string;
  previewUrl: string;
}

export interface EventCreatorTemplateSummary {
  id: string;
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateCandidateEvent {
  id: string;
  title: string;
  status: string;
  startAt: string;
  visibility: 'public' | 'unlisted' | 'private';
}
