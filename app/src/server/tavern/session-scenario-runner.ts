import type { PlayerCommunicationCard } from "../communication/types.ts";
import {
  createCommunicationDraft,
  listPlayerCommunicationCards,
  publishCommunicationNow,
} from "../communication/service.ts";
import { createSession, getCampaignBySlug, listCampaignRoster } from "../campaigns/service.ts";
import {
  commitCharacterSpendPlan,
  createCharacterSpendPlan,
  listCharacterSpendPlans,
  listCharacterXpTransactions,
  previewCharacterSpendPlan,
  recordXpTransaction,
  type CharacterSpendPlanPreview,
  type CharacterSpendPlanSummary,
  type XpTransactionRecord,
} from "../progression/index.ts";
import { getCharacterShellData } from "./character-shell.ts";
import { getCompendiumData } from "./compendium.ts";
import { getInventoryItemsData } from "./inventory.ts";
import { getJournalData } from "./journal.ts";
import { taliLevelUpScenario } from "./session-scenarios.ts";
import type {
  TavernCompendiumData,
  TavernInventoryItemsData,
  TavernJournalData,
  TavernSessionScenario,
  TavernShellData,
} from "./types.ts";

export interface TavernSessionSnapshot {
  shell: TavernShellData;
  journal: TavernJournalData;
  compendium: TavernCompendiumData;
  inventoryItems: TavernInventoryItemsData;
  playerCards: PlayerCommunicationCard[];
  xpTransactions: XpTransactionRecord[];
  spendPlans: CharacterSpendPlanSummary[];
}

export interface TavernSessionScenarioResult {
  scenario: TavernSessionScenario;
  campaignId: string;
  characterId: string;
  sessionId: string;
  communicationId: string;
  preview: CharacterSpendPlanPreview;
  before: TavernSessionSnapshot;
  after: TavernSessionSnapshot;
}

async function loadSnapshot(characterId: string): Promise<TavernSessionSnapshot> {
  const [shell, journal, compendium, inventoryItems, playerCards, xpTransactions, spendPlans] =
    await Promise.all([
      getCharacterShellData(characterId),
      getJournalData(characterId),
      getCompendiumData({
        characterId,
        q: "Hex",
        entry: "aa-spell-hex",
        entryPack: "advanced-adventurers",
      }),
      getInventoryItemsData(characterId),
      (async () => {
        const shellData = await getCharacterShellData(characterId);
        if (!shellData) {
          return [];
        }

        return listPlayerCommunicationCards(shellData.campaign.id, characterId);
      })(),
      listCharacterXpTransactions(characterId),
      listCharacterSpendPlans(characterId),
    ]);

  if (!shell) {
    throw new Error(`Character ${characterId} is missing Tavern shell data`);
  }

  return {
    shell,
    journal,
    compendium,
    inventoryItems,
    playerCards,
    xpTransactions,
    spendPlans,
  };
}

export async function runTavernSessionScenario(
  scenario: TavernSessionScenario = taliLevelUpScenario,
): Promise<TavernSessionScenarioResult> {
  const campaign = await getCampaignBySlug(scenario.campaignSlug);
  if (!campaign) {
    throw new Error(`Campaign ${scenario.campaignSlug} not found`);
  }

  const roster = await listCampaignRoster(campaign.id);
  const character = roster.find((entry) => entry.slug === scenario.characterSlug);
  if (!character) {
    throw new Error(
      `Character ${scenario.characterSlug} not found in ${scenario.campaignSlug}`,
    );
  }

  const session = await createSession({
    campaignId: campaign.id,
    sessionNumber: scenario.session.sessionNumber,
    title: scenario.session.title,
  });
  const draft = await createCommunicationDraft({
    campaignId: campaign.id,
    sessionId: session.id,
    kind: scenario.communication.kind,
    audience: {
      audienceKind: "character",
      targetCharacterIds: [character.id],
    },
    title: scenario.communication.title,
    summary: scenario.communication.summary,
    bodyMd: scenario.communication.bodyMd,
    refs: scenario.communication.refs,
    createdByLabel: "tavern-session-scenario",
  });

  await publishCommunicationNow({
    itemId: draft.id,
    actorLabel: "tavern-session-scenario",
  });

  const before = await loadSnapshot(character.id);

  await recordXpTransaction({
    campaignId: campaign.id,
    characterId: character.id,
    sessionId: session.id,
    category: "award",
    amount: scenario.xpAward.amount,
    note: scenario.xpAward.note,
    createdByLabel: "tavern-session-scenario",
  });

  const preview = await previewCharacterSpendPlan(
    campaign.id,
    character.id,
    scenario.spendPlan.planJson,
  );
  const spendPlan = await createCharacterSpendPlan({
    campaignId: campaign.id,
    characterId: character.id,
    sessionId: session.id,
    kind: "level-up",
    summary: scenario.spendPlan.summary,
    notes: scenario.spendPlan.notes,
    planJson: scenario.spendPlan.planJson,
    createdByLabel: "tavern-session-scenario",
  });

  await commitCharacterSpendPlan({
    planId: spendPlan.id,
    actorLabel: "tavern-session-scenario",
  });

  const after = await loadSnapshot(character.id);

  return {
    scenario,
    campaignId: campaign.id,
    characterId: character.id,
    sessionId: session.id,
    communicationId: draft.id,
    preview,
    before,
    after,
  };
}
