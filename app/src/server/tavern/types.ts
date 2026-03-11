import type { CommunicationKind } from "../db/schema/index.ts";
import type { ProgressionMode } from "../db/schema/campaigns.ts";

export interface TavernCampaignData {
  id: string;
  slug: string;
  name: string;
  progressionMode: ProgressionMode;
  enabledPackIds: string[];
}

export interface TavernCharacterData {
  id: string;
  slug: string;
  name: string;
  ownerLabel: string | null;
}

export interface TavernAbilityScore {
  name: string;
  score: number;
  modifier: number;
  isPrimary: boolean;
}

export interface TavernViewer {
  role: "dm" | "player";
  characterId: string | null;
  sessionLabel: string | null;
  canEditCharacter: boolean;
  canManageCampaign: boolean;
}

export interface TavernConditionData {
  id: string;
  name: string;
  note: string | null;
  sourceCreature: string | null;
}

export interface TavernCombatData {
  maxHp: number;
  currentHp: number;
  tempHp: number;
  armorClass: number;
  acBreakdown: string;
  initiative: number;
  speed: number;
  spellSaveDc: number | null;
  proficiencyBonus: number;
  conditions: TavernConditionData[];
}

export interface TavernSkillData {
  name: string;
  bonus: number;
  proficient: boolean;
  expertise: boolean;
}

export interface TavernFeatureData {
  name: string;
  origin: string;
}

export interface TavernXpData {
  totalEarned: number;
  totalSpent: number;
  banked: number;
}

export interface TavernCharacterSummary {
  subtitle: string;
  className: string;
  species: string;
  level: number;
  abilityScores: TavernAbilityScore[];
  combat: TavernCombatData;
  skills: TavernSkillData[];
  features: TavernFeatureData[];
  xp: TavernXpData;
}

export interface TavernSpellData {
  name: string;
  school: string;
  castingTime: string;
  concentration: boolean;
  ritual: boolean;
  alwaysPrepared: boolean;
  freeCast:
    | {
        resourceName: string;
        current: number;
        max: number;
      }
    | null;
}

export interface TavernSpellSlotPoolData {
  resourceName: string;
  kind: "standard" | "pact";
  level: number;
  total: number;
  current: number;
}

export interface TavernSpellGroupData {
  level: number;
  label: string;
  spells: TavernSpellData[];
  slots: TavernSpellSlotPoolData[];
}

export interface TavernSpellbookData {
  castingAbility: string | null;
  spellSaveDC: number | null;
  spellAttackBonus: number | null;
  groups: TavernSpellGroupData[];
}

export interface TavernInventoryItem {
  id: string;
  name: string;
  quantity: number;
  equipped: boolean;
  slot: string | null;
}

export interface TavernInventoryAttackProfile {
  weaponName: string;
  attackBonus: string;
  damage: string;
  damageType: string;
  properties: string[];
  masteryProperty: string | null;
}

export interface TavernInventoryResource {
  resourceName: string;
  name: string;
  current: number;
  max: number;
  rechargeOn: string;
  source: string;
}

export interface TavernInventoryRuntimeData {
  attackProfiles: TavernInventoryAttackProfile[];
  resources: TavernInventoryResource[];
}

export interface TavernInventoryItemsData {
  equippedItems: TavernInventoryItem[];
  carriedItems: TavernInventoryItem[];
}

export interface TavernInventoryData
  extends TavernInventoryRuntimeData,
    TavernInventoryItemsData {}

export interface TavernShellData {
  campaign: TavernCampaignData;
  character: TavernCharacterData;
  viewer: TavernViewer;
  summary: TavernCharacterSummary;
  spellbook: TavernSpellbookData;
  inventoryRuntime: TavernInventoryRuntimeData;
}

export interface TavernJournalCard {
  id: string;
  title: string;
  bodyMd: string;
  summary: string | null;
  category: CommunicationKind;
  isPinned: boolean;
  publishedAt: string;
}

export interface TavernJournalData {
  cards: TavernJournalCard[];
}

export interface TavernCompendiumQuery {
  characterId: string;
  q?: string;
  type?: string;
  pack?: string;
  entry?: string;
  entryPack?: string;
}

export interface TavernCompendiumEntry {
  entityId: string;
  packId: string;
  type: string;
  name: string;
  summary: string | null;
  tags: string[];
}

export interface TavernCompendiumEntryDetail extends TavernCompendiumEntry {
  bodyMd: string;
}

export interface TavernCompendiumData {
  entries: TavernCompendiumEntry[];
  totalCount: number;
  availableTypes: string[];
  availablePacks: string[];
  detail: TavernCompendiumEntryDetail | null;
}

export interface TavernSessionScenario {
  id: string;
  campaignSlug: string;
  characterSlug: string;
  session: {
    title: string;
    sessionNumber: number;
  };
  communication: {
    kind: CommunicationKind;
    title: string;
    summary: string;
    bodyMd: string;
    refs: Array<{
      refType: "spell";
      refPackId: string;
      refId: string;
    }>;
  };
  xpAward: {
    amount: number;
    note: string;
  };
  spendPlan: {
    summary: string;
    notes: string;
    planJson: {
      version: 1;
      operations: Array<{
        type: "class-level";
        classEntityId: string;
        classPackId: "srd-5e-2024";
        levelsGranted: number;
        xpCost: number;
      }>;
    };
  };
}
