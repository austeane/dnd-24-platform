import { beforeEach, describe, expect, it } from "vitest";
import { getCampaignBySlug, listCampaignRoster } from "../campaigns/index.ts";
import { resetAndSeedRealCampaign } from "../test/integration-helpers.ts";
import { getCharacterRuntimeState } from "./character-state.ts";
import {
  applyDamage,
  clearTemporaryHitPoints,
  gainTemporaryHitPoints,
  getCharacterHitPointState,
  healHitPoints,
  replaceTemporaryHitPoints,
} from "./hit-point-state.ts";
import { executeLongRest } from "./rest-service.ts";

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

describe("hit point state integration", () => {
  beforeEach(async () => {
    await resetAndSeedRealCampaign();
  });

  it("seeds Tali with a deterministic non-full HP state", async () => {
    const characterId = await getRosterCharacterId("tali");
    const state = await getCharacterRuntimeState(characterId);

    expect(state).not.toBeNull();
    expect(state!.currentHP).toBe(state!.maxHP - 4);
    expect(state!.tempHP).toBe(2);
  });

  it("damage consumes temporary HP before current HP", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    await replaceTemporaryHitPoints({
      characterId,
      amount: 5,
      createdByLabel: "integration-test",
    });

    await applyDamage({
      characterId,
      amount: 3,
      createdByLabel: "integration-test",
    });

    let state = await getCharacterRuntimeState(characterId);
    expect(state!.currentHP).toBe(state!.maxHP);
    expect(state!.tempHP).toBe(2);

    await applyDamage({
      characterId,
      amount: 7,
      createdByLabel: "integration-test",
    });

    state = await getCharacterRuntimeState(characterId);
    expect(state!.currentHP).toBe(state!.maxHP - 5);
    expect(state!.tempHP).toBe(0);
  });

  it("healing clamps at max HP", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    await applyDamage({
      characterId,
      amount: 6,
      createdByLabel: "integration-test",
    });

    await healHitPoints({
      characterId,
      amount: 10,
      createdByLabel: "integration-test",
    });

    const state = await getCharacterRuntimeState(characterId);
    expect(state!.currentHP).toBe(state!.maxHP);
    expect(state!.tempHP).toBe(0);
  });

  it("temporary HP can be gained, replaced, and cleared", async () => {
    const characterId = await getRosterCharacterId("vivennah");

    await gainTemporaryHitPoints({
      characterId,
      amount: 3,
      createdByLabel: "integration-test",
    });
    await gainTemporaryHitPoints({
      characterId,
      amount: 2,
      createdByLabel: "integration-test",
    });

    let hitPoints = await getCharacterHitPointState(characterId);
    expect(hitPoints?.tempHp).toBe(3);

    await replaceTemporaryHitPoints({
      characterId,
      amount: 1,
      createdByLabel: "integration-test",
    });

    hitPoints = await getCharacterHitPointState(characterId);
    expect(hitPoints?.tempHp).toBe(1);

    await clearTemporaryHitPoints({
      characterId,
      createdByLabel: "integration-test",
    });

    hitPoints = await getCharacterHitPointState(characterId);
    expect(hitPoints?.tempHp).toBe(0);
  });

  it("executeLongRest restores current HP to full and clears temporary HP", async () => {
    const characterId = await getRosterCharacterId("ronan-wildspark");

    await replaceTemporaryHitPoints({
      characterId,
      amount: 4,
      createdByLabel: "integration-test",
    });
    await applyDamage({
      characterId,
      amount: 9,
      createdByLabel: "integration-test",
    });

    let state = await getCharacterRuntimeState(characterId);
    expect(state!.currentHP).toBe(state!.maxHP - 5);
    expect(state!.tempHP).toBe(0);

    await gainTemporaryHitPoints({
      characterId,
      amount: 3,
      createdByLabel: "integration-test",
    });

    await executeLongRest({
      characterId,
      createdByLabel: "integration-test",
    });

    state = await getCharacterRuntimeState(characterId);
    expect(state!.currentHP).toBe(state!.maxHP);
    expect(state!.tempHP).toBe(0);
  });
});
