import type {
  TavernSessionScenarioResult,
  TavernSessionSnapshot,
} from "../../app/src/server/tavern/session-scenario-runner.ts";

export interface SerializedTavernSessionSnapshot {
  scenarioId: string;
  campaignId: string;
  characterSlug: string;
  before: SerializedSnapshotPhase;
  after: SerializedSnapshotPhase;
}

interface SerializedSnapshotPhase {
  shell: Omit<TavernSessionSnapshot["shell"], "character"> & {
    character: {
      slug: string;
      name: string;
      ownerLabel: string | null;
    };
  };
  journal: Array<{
    title: string;
    summary: string | null;
    category: string;
    isPinned: boolean;
  }>;
  inventoryItems: TavernSessionSnapshot["inventoryItems"];
  compendium: {
    totalCount: number;
    entryIds: string[];
    detail:
      | {
          entityId: string;
          packId: string;
          name: string;
          type: string;
        }
      | null;
  };
  playerCards: Array<{
    title: string;
    refs: Array<{
      refId: string;
      refPackId: string | null;
      refType: string;
    }>;
  }>;
  xpTransactions: Array<{
    category: string;
    amount: number;
    note: string;
  }>;
  spendPlans: Array<{
    state: string;
    kind: string;
    summary: string;
    totalXpCost: number;
  }>;
}

function serializePhase(phase: TavernSessionSnapshot): SerializedSnapshotPhase {
  return {
    shell: {
      ...phase.shell,
      character: {
        slug: phase.shell.character.slug,
        name: phase.shell.character.name,
        ownerLabel: phase.shell.character.ownerLabel,
      },
    },
    journal: phase.journal.cards.map((card) => ({
      title: card.title,
      summary: card.summary,
      category: card.category,
      isPinned: card.isPinned,
    })),
    inventoryItems: phase.inventoryItems,
    compendium: {
      totalCount: phase.compendium.totalCount,
      entryIds: phase.compendium.entries.map((entry) => `${entry.packId}:${entry.entityId}`),
      detail: phase.compendium.detail
        ? {
            entityId: phase.compendium.detail.entityId,
            packId: phase.compendium.detail.packId,
            name: phase.compendium.detail.name,
            type: phase.compendium.detail.type,
          }
        : null,
    },
    playerCards: phase.playerCards.map((card) => ({
      title: card.title,
      refs: card.refs.map((ref) => ({
        refId: ref.refId,
        refPackId: ref.refPackId,
        refType: ref.refType,
      })),
    })),
    xpTransactions: phase.xpTransactions.map((transaction) => ({
      category: transaction.category,
      amount: transaction.amount,
      note: transaction.note,
    })),
    spendPlans: phase.spendPlans.map((plan) => ({
      state: plan.state,
      kind: plan.kind,
      summary: plan.summary,
      totalXpCost: plan.totalXpCost,
    })),
  };
}

export function serializeTavernSessionSnapshot(
  result: TavernSessionScenarioResult,
): SerializedTavernSessionSnapshot {
  return {
    scenarioId: result.scenario.id,
    campaignId: result.campaignId,
    characterSlug: result.before.shell.character.slug,
    before: serializePhase(result.before),
    after: serializePhase(result.after),
  };
}
