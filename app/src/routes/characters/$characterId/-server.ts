import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import {
  applyConditionWithEffects,
  applyDamage,
  clearTemporaryHitPoints,
  commitCharacterSpendPlan,
  createCharacterSpendPlan,
  executeLongRest,
  executeShortRest,
  gainTemporaryHitPoints,
  healHitPoints,
  previewCharacterSpendPlan,
  removeConditionWithEffects,
  spendFreeCast,
  spendResourceWithValidation,
  spendSpellSlot,
  restoreResourceWithValidation,
} from "../../../server/progression/index.ts";
import { getTavernCharacterContext } from "../../../server/tavern/context.ts";
import { getCharacterShellData } from "../../../server/tavern/character-shell.ts";
import { getCompendiumData } from "../../../server/tavern/compendium.ts";
import { getInventoryItemsData } from "../../../server/tavern/inventory.ts";
import { getJournalData } from "../../../server/tavern/journal.ts";
import type {
  TavernCompendiumData,
  TavernCompendiumQuery,
  TavernInventoryItemsData,
  TavernJournalData,
  TavernShellData,
  TavernViewer,
} from "../../../server/tavern/types.ts";
import {
  buildAccessRedirectPath,
  resolveCharacterViewer,
} from "../../../server/tavern/viewer.ts";

export interface CharacterShellResponse {
  shell: TavernShellData | null;
  redirectTo: string | null;
}

export interface CharacterTabResponse<T> {
  data: T;
  redirectTo: string | null;
}

export type {
  TavernCompendiumData,
  TavernCompendiumQuery,
  TavernInventoryItemsData,
  TavernJournalData,
  TavernShellData,
};

function actorLabel(viewer: TavernViewer): string {
  return viewer.sessionLabel ?? (viewer.role === "dm" ? "dm-web" : "player-web");
}

async function resolvePrimaryClassSource(characterId: string): Promise<{
  entityId: string;
  packId: string;
  label: string;
}> {
  const context = await getTavernCharacterContext(characterId);
  const classSource = context?.runtime?.sources.find(
    (entry) => entry.source.kind === "class-level",
  );
  if (!classSource?.source.entityId) {
    throw new Error("Current class source is not available for level-up");
  }

  return {
    entityId: classSource.source.entityId,
    packId: classSource.source.packId ?? "srd-5e-2024",
    label: classSource.source.name,
  };
}

async function resolveCharacterRequest(
  request: Request,
  characterId: string,
): Promise<
  | {
      context: NonNullable<Awaited<ReturnType<typeof getTavernCharacterContext>>>;
      viewer: TavernViewer;
    }
  | {
      redirectTo: string;
    }
  | null
> {
  const context = await getTavernCharacterContext(characterId, {
    includeRuntime: false,
  });
  if (!context) {
    return null;
  }

  try {
    const viewer = await resolveCharacterViewer(
      request,
      context.campaign.id,
      characterId,
    );
    if (!viewer) {
      return {
        redirectTo: buildAccessRedirectPath({
          campaignSlug: context.campaign.slug,
          next: `/characters/${characterId}`,
          role: "player",
          characterId,
        }),
      };
    }

    return {
      context,
      viewer,
    };
  } catch {
    return {
      redirectTo: buildAccessRedirectPath({
        campaignSlug: context.campaign.slug,
        next: `/characters/${characterId}`,
        role: "player",
        characterId,
      }),
    };
  }
}

async function requireCharacterMutationAccess(
  request: Request,
  characterId: string,
): Promise<TavernViewer> {
  const resolved = await resolveCharacterRequest(request, characterId);
  if (!resolved || "redirectTo" in resolved) {
    throw new Error("Character access required");
  }
  if (!resolved.viewer.canEditCharacter) {
    throw new Error("Character editing is not allowed");
  }

  return resolved.viewer;
}

export const fetchCharacterShellData = createServerFn({ method: "GET" })
  .inputValidator((input: { characterId: string }) => input)
  .handler(async ({ data }) => {
    const resolved = await resolveCharacterRequest(getRequest(), data.characterId);
    if (!resolved) {
      return {
        shell: null,
        redirectTo: null,
      } satisfies CharacterShellResponse;
    }
    if ("redirectTo" in resolved) {
      return {
        shell: null,
        redirectTo: resolved.redirectTo,
      } satisfies CharacterShellResponse;
    }

    return {
      shell: await getCharacterShellData(data.characterId, resolved.viewer),
      redirectTo: null,
    } satisfies CharacterShellResponse;
  });

export const fetchInventoryItemsData = createServerFn({ method: "GET" })
  .inputValidator((input: { characterId: string }) => input)
  .handler(async ({ data }) => {
    const resolved = await resolveCharacterRequest(getRequest(), data.characterId);
    if (!resolved) {
      throw new Error("Character not found");
    }
    if ("redirectTo" in resolved) {
      return {
        data: {
          equippedItems: [],
          carriedItems: [],
        },
        redirectTo: resolved.redirectTo,
      } satisfies CharacterTabResponse<TavernInventoryItemsData>;
    }

    return {
      data: await getInventoryItemsData(data.characterId),
      redirectTo: null,
    } satisfies CharacterTabResponse<TavernInventoryItemsData>;
  });

export const fetchJournalData = createServerFn({ method: "GET" })
  .inputValidator((input: { characterId: string }) => input)
  .handler(async ({ data }) => {
    const resolved = await resolveCharacterRequest(getRequest(), data.characterId);
    if (!resolved) {
      throw new Error("Character not found");
    }
    if ("redirectTo" in resolved) {
      return {
        data: { cards: [] },
        redirectTo: resolved.redirectTo,
      } satisfies CharacterTabResponse<TavernJournalData>;
    }

    return {
      data: await getJournalData(data.characterId),
      redirectTo: null,
    } satisfies CharacterTabResponse<TavernJournalData>;
  });

export const fetchCompendiumData = createServerFn({ method: "GET" })
  .inputValidator((input: TavernCompendiumQuery) => input)
  .handler(async ({ data }) => {
    const resolved = await resolveCharacterRequest(getRequest(), data.characterId);
    if (!resolved) {
      throw new Error("Character not found");
    }
    if ("redirectTo" in resolved) {
      return {
        data: {
          entries: [],
          totalCount: 0,
          availableTypes: [],
          availablePacks: [],
          detail: null,
        },
        redirectTo: resolved.redirectTo,
      } satisfies CharacterTabResponse<TavernCompendiumData>;
    }

    return {
      data: await getCompendiumData(data),
      redirectTo: null,
    } satisfies CharacterTabResponse<TavernCompendiumData>;
  });

export const applyCharacterDamage = createServerFn({ method: "POST" })
  .inputValidator((input: { characterId: string; amount: number; note?: string }) => input)
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await applyDamage({
      characterId: data.characterId,
      amount: data.amount,
      note: data.note,
      createdByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const healCharacter = createServerFn({ method: "POST" })
  .inputValidator((input: { characterId: string; amount: number; note?: string }) => input)
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await healHitPoints({
      characterId: data.characterId,
      amount: data.amount,
      note: data.note,
      createdByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const grantTemporaryHitPoints = createServerFn({ method: "POST" })
  .inputValidator((input: { characterId: string; amount: number; note?: string }) => input)
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await gainTemporaryHitPoints({
      characterId: data.characterId,
      amount: data.amount,
      note: data.note,
      createdByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const clearCharacterTemporaryHitPoints = createServerFn({ method: "POST" })
  .inputValidator((input: { characterId: string; note?: string }) => input)
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await clearTemporaryHitPoints({
      characterId: data.characterId,
      note: data.note,
      createdByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const performCharacterShortRest = createServerFn({ method: "POST" })
  .inputValidator((input: { characterId: string; note?: string }) => input)
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await executeShortRest({
      characterId: data.characterId,
      note: data.note,
      createdByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const performCharacterLongRest = createServerFn({ method: "POST" })
  .inputValidator((input: { characterId: string; note?: string }) => input)
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await executeLongRest({
      characterId: data.characterId,
      note: data.note,
      createdByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const applyCharacterCondition = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      characterId: string;
      conditionName: "charmed" | "concentration" | "incapacitated";
      note?: string;
      sourceCreature?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await applyConditionWithEffects({
      characterId: data.characterId,
      conditionName: data.conditionName,
      note: data.note,
      sourceCreature: data.sourceCreature,
      appliedByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const removeCharacterCondition = createServerFn({ method: "POST" })
  .inputValidator((input: { characterId: string; conditionId: string; note?: string }) => input)
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await removeConditionWithEffects({
      conditionId: data.conditionId,
      note: data.note,
      removedByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const spendCharacterSpellSlot = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      characterId: string;
      slotLevel: number;
      isPactMagic?: boolean;
      note?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await spendSpellSlot({
      characterId: data.characterId,
      slotLevel: data.slotLevel,
      isPactMagic: data.isPactMagic,
      note: data.note,
      createdByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const spendCharacterFreeCast = createServerFn({ method: "POST" })
  .inputValidator((input: { characterId: string; spellName: string; note?: string }) => input)
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await spendFreeCast({
      characterId: data.characterId,
      spellName: data.spellName,
      note: data.note,
      createdByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const spendCharacterResource = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      characterId: string;
      resourceName: string;
      amount?: number;
      note?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await spendResourceWithValidation({
      characterId: data.characterId,
      resourceName: data.resourceName,
      amount: data.amount ?? 1,
      note: data.note,
      createdByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const restoreCharacterResource = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      characterId: string;
      resourceName: string;
      amount?: number;
      note?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const viewer = await requireCharacterMutationAccess(getRequest(), data.characterId);
    await restoreResourceWithValidation({
      characterId: data.characterId,
      resourceName: data.resourceName,
      amount: data.amount ?? 1,
      note: data.note,
      createdByLabel: actorLabel(viewer),
    });
    return { ok: true };
  });

export const previewCharacterLevelUp = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      characterId: string;
      levelsGranted: number;
      xpCost: number;
    }) => input,
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    await requireCharacterMutationAccess(request, data.characterId);
    const resolved = await resolveCharacterRequest(request, data.characterId);
    if (!resolved || "redirectTo" in resolved) {
      throw new Error("Character access required");
    }
    const classSource = await resolvePrimaryClassSource(data.characterId);

    const preview = await previewCharacterSpendPlan(
      resolved.context.campaign.id,
      data.characterId,
      {
        version: 1,
        operations: [
          {
            type: "class-level",
            classEntityId: classSource.entityId,
            classPackId: classSource.packId,
            levelsGranted: data.levelsGranted,
            xpCost: data.xpCost,
            label: classSource.label,
          },
        ],
      },
    );

    return {
      totalXpCost: preview.totalXpCost,
      bankedXpBefore: preview.bankedXpBefore,
      bankedXpAfter: preview.bankedXpAfter,
    };
  });

export const commitCharacterLevelUp = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      characterId: string;
      levelsGranted: number;
      xpCost: number;
      summary?: string;
      notes?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const request = getRequest();
    const viewer = await requireCharacterMutationAccess(request, data.characterId);
    const resolved = await resolveCharacterRequest(request, data.characterId);
    if (!resolved || "redirectTo" in resolved) {
      throw new Error("Character access required");
    }
    const classSource = await resolvePrimaryClassSource(data.characterId);

    const plan = await createCharacterSpendPlan({
      campaignId: resolved.context.campaign.id,
      characterId: data.characterId,
      kind: "level-up",
      summary:
        data.summary ??
        `${resolved.context.character.name} gains ${data.levelsGranted} level${data.levelsGranted === 1 ? "" : "s"}`,
      notes: data.notes ?? null,
      planJson: {
        version: 1,
        operations: [
          {
            type: "class-level",
            classEntityId: classSource.entityId,
            classPackId: classSource.packId,
            levelsGranted: data.levelsGranted,
            xpCost: data.xpCost,
            label: classSource.label,
          },
        ],
      },
      createdByLabel: actorLabel(viewer),
    });

    await commitCharacterSpendPlan({
      planId: plan.id,
      actorLabel: actorLabel(viewer),
    });

    return {
      planId: plan.id,
    };
  });
