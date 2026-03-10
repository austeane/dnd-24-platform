import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  AudienceKind,
  CommunicationKind,
  CommunicationRefType,
  CommunicationState,
} from "../db/schema/index.ts";
import {
  communicationEvents,
  communicationItems,
  communicationRefs,
  communicationTargets,
} from "../db/schema/index.ts";

export type CommunicationItemRecord = InferSelectModel<typeof communicationItems>;
export type NewCommunicationItemRecord = InferInsertModel<typeof communicationItems>;

export type CommunicationTargetRecord = InferSelectModel<
  typeof communicationTargets
>;
export type NewCommunicationTargetRecord = InferInsertModel<
  typeof communicationTargets
>;

export type CommunicationRefRecord = InferSelectModel<typeof communicationRefs>;
export type NewCommunicationRefRecord = InferInsertModel<typeof communicationRefs>;

export type CommunicationEventRecord = InferSelectModel<
  typeof communicationEvents
>;
export type NewCommunicationEventRecord = InferInsertModel<
  typeof communicationEvents
>;

export interface CommunicationRefView {
  refType: CommunicationRefType;
  refId: string;
  refPackId: string | null;
  label: string;
}

export interface PlayerCommunicationCard {
  id: string;
  kind: CommunicationKind;
  title: string;
  summary: string | null;
  bodyMd: string;
  isPinned: boolean;
  publishedAt: Date;
  refs: CommunicationRefView[];
}

export interface DmCommunicationBoardItem {
  id: string;
  kind: CommunicationKind;
  state: CommunicationState;
  audienceKind: AudienceKind;
  title: string;
  sessionId: string | null;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  pinnedAt: Date | null;
  targetCharacterIds: string[];
}

export interface CommunicationAudienceInput {
  audienceKind: AudienceKind;
  targetCharacterIds?: string[];
}

export interface CommunicationRefInput {
  refType: CommunicationRefType;
  refId: string;
  refPackId?: string | null;
  labelOverride?: string | null;
  sortOrder?: number;
}

export interface CreateCommunicationDraftInput {
  id?: string;
  campaignId: string;
  sessionId?: string | null;
  kind: CommunicationKind;
  audience: CommunicationAudienceInput;
  title: string;
  summary?: string | null;
  bodyMd: string;
  refs?: CommunicationRefInput[];
  createdByLabel: string;
}

export interface EditCommunicationDraftInput {
  itemId: string;
  actorLabel: string;
  title?: string;
  summary?: string | null;
  bodyMd?: string;
  refs?: CommunicationRefInput[];
}

export interface ScheduleCommunicationInput {
  itemId: string;
  actorLabel: string;
  scheduledFor: Date;
}

export interface PublishCommunicationNowInput {
  itemId: string;
  actorLabel: string;
  publishedAt?: Date;
}

export interface ChangeCommunicationAudienceInput {
  itemId: string;
  actorLabel: string;
  audience: CommunicationAudienceInput;
}

export interface PinCommunicationInput {
  itemId: string;
  actorLabel: string;
  pinRank: number;
  pinnedAt?: Date;
}

export interface UnpinCommunicationInput {
  itemId: string;
  actorLabel: string;
}

export interface ArchiveCommunicationInput {
  itemId: string;
  actorLabel: string;
  archivedAt?: Date;
}
