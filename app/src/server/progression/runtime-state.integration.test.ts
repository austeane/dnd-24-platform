import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getCampaignBySlug, listCampaignRoster } from "../campaigns/index.ts";
import { db } from "../db/index.ts";
import { characterResourcePools, characterSources } from "../db/schema/index.ts";
import { resetAndSeedRealCampaign } from "../test/integration-helpers.ts";
import { getCharacterRuntimeState } from "./character-state.ts";
import { applyCondition } from "./condition-state.ts";
import { syncCharacterDerivedState } from "./derived-state.ts";
import { restoreResource, spendResource } from "./resource-state.ts";
import { spendSpellSlot } from "./spell-slot-state.ts";

async function getRosterCharacterId(slug: string): Promise<string> {
  const campaign = await getCampaignBySlug("real-aa-campaign");
  if (!campaign) {
    throw new Error("real-aa-campaign not found");
  }

  const roster = await listCampaignRoster(campaign.id);
  const character = roster.find((entry) => entry.slug === slug);
  if (!character) {
    throw new Error(`Character ${slug} not found in roster`);
  }

  return character.id;
}

describe("DB-backed runtime projection", () => {
  beforeEach(async () => {
    await resetAndSeedRealCampaign();
  });

  it("includes active conditions and tracked spell-slot state in runtime reads", async () => {
    const characterId = await getRosterCharacterId("oriana");

    await spendSpellSlot({
      characterId,
      slotLevel: 1,
      isPactMagic: true,
      createdByLabel: "integration-test",
    });
    await applyCondition({
      characterId,
      conditionName: "charmed",
      appliedByLabel: "integration-test",
    });

    const state = await getCharacterRuntimeState(characterId);

    expect(state?.conditions.active.map((condition) => condition.conditionName)).toContain("charmed");
    expect(state?.spellcasting?.slotPools.find((pool) => pool.source === "Pact Magic")?.slots).toEqual([
      { level: 1, total: 2, current: 1 },
    ]);
  });

  it("rejects non-positive resource mutations and reflects spend/restore readbacks", async () => {
    const characterId = await getRosterCharacterId("vivennah");

    await expect(spendResource({
      characterId,
      resourceName: "Bardic Inspiration",
      amount: 0,
      createdByLabel: "integration-test",
    })).rejects.toThrow("positive integer");

    await expect(restoreResource({
      characterId,
      resourceName: "Bardic Inspiration",
      amount: -1,
      createdByLabel: "integration-test",
    })).rejects.toThrow("positive integer");

    await spendResource({
      characterId,
      resourceName: "Bardic Inspiration",
      amount: 1,
      createdByLabel: "integration-test",
    });

    let state = await getCharacterRuntimeState(characterId);
    expect(state?.resources.find((resource) => resource.name === "Bardic Inspiration")).toMatchObject({
      currentUses: 2,
      maxUses: 3,
      isTracked: true,
    });

    await restoreResource({
      characterId,
      resourceName: "Bardic Inspiration",
      amount: 1,
      createdByLabel: "integration-test",
    });

    state = await getCharacterRuntimeState(characterId);
    expect(state?.resources.find((resource) => resource.name === "Bardic Inspiration")).toMatchObject({
      currentUses: 3,
      maxUses: 3,
      isTracked: true,
    });
  });

  it("clamps current uses when synced max uses shrink", async () => {
    const characterId = await getRosterCharacterId("vivennah");
    const [baseSource] = await db
      .select()
      .from(characterSources)
      .where(eq(characterSources.characterId, characterId));
    const baseSnapshotSource = baseSource && baseSource.sourceKind === "override"
      ? baseSource
      : (await db
        .select()
        .from(characterSources)
        .where(eq(characterSources.characterId, characterId)))
        .find((source) => source.sourceKind === "override");

    if (!baseSnapshotSource || !baseSnapshotSource.payloadJson) {
      throw new Error("Base snapshot source not found");
    }

    const nextPayload = structuredClone(baseSnapshotSource.payloadJson);
    const baseSnapshot = nextPayload.baseSnapshot as {
      abilityScores: { charisma: number };
    };
    baseSnapshot.abilityScores.charisma = 8;

    await db
      .update(characterSources)
      .set({
        payloadJson: nextPayload,
        updatedAt: new Date(),
      })
      .where(eq(characterSources.id, baseSnapshotSource.id));

    await syncCharacterDerivedState(characterId);

    const [pool] = await db
      .select()
      .from(characterResourcePools)
      .where(
        eq(characterResourcePools.characterId, characterId),
      );
    const bardicPool = (await db
      .select()
      .from(characterResourcePools)
      .where(eq(characterResourcePools.characterId, characterId)))
      .find((row) => row.resourceName === "Bardic Inspiration");

    expect(pool).toBeDefined();
    expect(bardicPool).toMatchObject({
      currentUses: 1,
      maxUses: 1,
    });

    const state = await getCharacterRuntimeState(characterId);
    expect(state?.resources.find((resource) => resource.name === "Bardic Inspiration")).toMatchObject({
      currentUses: 1,
      maxUses: 1,
    });
  });
});
