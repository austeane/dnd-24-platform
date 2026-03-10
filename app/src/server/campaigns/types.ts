import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  LevelingMethod,
  ProgressionMode,
} from "../db/schema/index.ts";
import { campaigns, characters, sessions } from "../db/schema/index.ts";

export type CampaignRecord = InferSelectModel<typeof campaigns>;
export type NewCampaignRecord = InferInsertModel<typeof campaigns>;

export type CharacterRecord = InferSelectModel<typeof characters>;
export type NewCharacterRecord = InferInsertModel<typeof characters>;

export type SessionRecord = InferSelectModel<typeof sessions>;
export type NewSessionRecord = InferInsertModel<typeof sessions>;

export interface CampaignSummary {
  id: string;
  slug: string;
  name: string;
  progressionMode: ProgressionMode;
  levelingMethod: LevelingMethod;
  enabledPackIds: string[];
  characterCount: number;
  sessionCount: number;
}

export interface CampaignRosterEntry {
  id: string;
  slug: string;
  name: string;
  ownerLabel: string | null;
}

export interface SessionListItem {
  id: string;
  sessionNumber: number;
  title: string;
  startsAt: Date | null;
  endedAt: Date | null;
}

export interface CreateCampaignInput {
  id?: string;
  slug: string;
  name: string;
  progressionMode?: ProgressionMode;
  levelingMethod?: LevelingMethod;
  enabledPackIds?: string[];
}

export interface UpdateCampaignSettingsInput {
  campaignId: string;
  name?: string;
  progressionMode?: ProgressionMode;
  levelingMethod?: LevelingMethod;
  enabledPackIds?: string[];
}

export interface CreateCharacterInput {
  id?: string;
  campaignId: string;
  slug: string;
  name: string;
  ownerLabel?: string | null;
}

export interface UpdateCharacterIdentityInput {
  characterId: string;
  slug?: string;
  name?: string;
  ownerLabel?: string | null;
}

export interface CreateSessionInput {
  id?: string;
  campaignId: string;
  sessionNumber: number;
  title: string;
  startsAt?: Date | null;
  endedAt?: Date | null;
  recapMd?: string | null;
  dmNotesMd?: string | null;
}

export interface CampaignSettingsView {
  id: string;
  slug: string;
  name: string;
  progressionMode: ProgressionMode;
  levelingMethod: LevelingMethod;
  enabledPackIds: string[];
}

export interface UpdateSessionInput {
  sessionId: string;
  title?: string;
  startsAt?: Date | null;
  endedAt?: Date | null;
  recapMd?: string | null;
  dmNotesMd?: string | null;
}
