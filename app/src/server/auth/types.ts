import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  accessCredentials,
  accessSessions,
  type AccessCredentialRole,
} from "../db/schema/index.ts";

export type AccessCredentialRecord = InferSelectModel<typeof accessCredentials>;
export type NewAccessCredentialRecord = InferInsertModel<typeof accessCredentials>;

export type AccessSessionRecord = InferSelectModel<
  typeof accessSessions
>;
export type NewAccessSessionRecord = InferInsertModel<
  typeof accessSessions
>;

export interface SetAccessCredentialInput {
  campaignId: string;
  role: AccessCredentialRole;
  characterId?: string | null;
  password: string;
  passwordHint?: string | null;
  actorLabel: string;
}

export interface VerifyAccessCredentialInput {
  campaignId: string;
  role: AccessCredentialRole;
  characterId?: string | null;
  password: string;
}

export interface SetDmPasswordInput {
  campaignId: string;
  password: string;
  passwordHint?: string | null;
  actorLabel: string;
}

export interface SetCharacterPasswordInput {
  campaignId: string;
  characterId: string;
  password: string;
  passwordHint?: string | null;
  actorLabel: string;
}

export interface CreateAccessSessionInput {
  campaignId: string;
  password: string;
  actorLabel: string;
  characterId?: string | null;
  sessionLabel?: string | null;
  ttlHours?: number;
}

export interface AccessSessionToken {
  token: string;
  role: AccessCredentialRole;
  characterId: string | null;
  expiresAt: Date;
}

export interface ValidateAccessSessionInput {
  campaignId: string;
  token: string;
}

export interface ListAccessSessionsInput {
  campaignId: string;
  role?: AccessCredentialRole;
  characterId?: string | null;
}

export interface CampaignAccessStatus {
  campaignId: string;
  hasDmPassword: boolean;
  playerCharacterIds: string[];
}
