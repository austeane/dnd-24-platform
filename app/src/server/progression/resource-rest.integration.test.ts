import { describe, beforeEach, expect, it } from "vitest";
import { getCampaignBySlug, listCampaignRoster } from "../campaigns/index.ts";
import { resetAndSeedRealCampaign } from "../test/integration-helpers.ts";
import { getCharacterRuntimeState } from "./character-state.ts";
import {
  listCharacterResourcePools,
  spendResource,
  restoreResource,
  performShortRest,
  performLongRest,
  listCharacterResourceEvents,
} from "./resource-state.ts";
import {
  executeShortRest,
  executeLongRest,
  previewRestReset,
} from "./rest-service.ts";

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

describe("resource rest integration", () => {
  beforeEach(async () => {
    await resetAndSeedRealCampaign();
  });

  describe("short rest", () => {
    it("resets built-in short-rest pools and records an event", async () => {
      const characterId = await getRosterCharacterId("ronan-wildspark");

      // Spend a resource so there's something to reset
      await spendResource({
        characterId,
        resourceName: "Second Wind",
        amount: 1,
        createdByLabel: "integration-test",
      });

      // Verify it's spent
      const poolsBefore = await listCharacterResourcePools(characterId);
      const secondWindBefore = poolsBefore.find(
        (pool) => pool.resourceName === "Second Wind",
      );
      expect(secondWindBefore).toBeDefined();
      expect(secondWindBefore!.currentUses).toBe(secondWindBefore!.maxUses - 1);

      // Short rest
      const event = await performShortRest({
        characterId,
        createdByLabel: "integration-test",
        note: "Short rest after encounter",
      });

      expect(event.eventKind).toBe("short-rest-reset");
      expect(event.characterId).toBe(characterId);
      expect(event.changesJson.length).toBeGreaterThan(0);

      const secondWindChange = event.changesJson.find(
        (change) => change.resourceName === "Second Wind",
      );
      expect(secondWindChange).toBeDefined();
      expect(secondWindChange!.newUses).toBe(secondWindBefore!.maxUses);

      // Verify pool is back to max
      const poolsAfter = await listCharacterResourcePools(characterId);
      const secondWindAfter = poolsAfter.find(
        (pool) => pool.resourceName === "Second Wind",
      );
      expect(secondWindAfter!.currentUses).toBe(secondWindAfter!.maxUses);
    });

    it("restores Musician-adjusted Bardic Inspiration on short rest", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      await spendResource({
        characterId,
        resourceName: "Bardic Inspiration",
        amount: 2,
        createdByLabel: "integration-test",
      });

      const poolsBefore = await listCharacterResourcePools(characterId);
      const bardicBefore = poolsBefore.find(
        (pool) => pool.resourceName === "Bardic Inspiration",
      );
      expect(bardicBefore).toBeDefined();
      expect(bardicBefore!.resetOn).toBe("short");
      expect(bardicBefore!.currentUses).toBe(bardicBefore!.maxUses - 2);

      const event = await performShortRest({
        characterId,
        createdByLabel: "integration-test",
        note: "Short rest after encounter",
      });

      expect(event.eventKind).toBe("short-rest-reset");
      expect(event.characterId).toBe(characterId);

      const bardicChange = event.changesJson.find(
        (change) => change.resourceName === "Bardic Inspiration",
      );
      expect(bardicChange).toBeDefined();
      expect(bardicChange!.newUses).toBe(bardicBefore!.maxUses);

      const poolsAfter = await listCharacterResourcePools(characterId);
      const bardicAfter = poolsAfter.find(
        (pool) => pool.resourceName === "Bardic Inspiration",
      );
      expect(bardicAfter!.currentUses).toBe(bardicAfter!.maxUses);
    });

    it("does not reset long-rest-only pools on short rest", async () => {
      const characterId = await getRosterCharacterId("nara");

      const pools = await listCharacterResourcePools(characterId);
      const sorceryPoints = pools.find(
        (pool) => pool.resourceName === "Sorcery Points",
      );
      expect(sorceryPoints).toBeDefined();
      expect(sorceryPoints!.resetOn).toBe("long");

      await spendResource({
        characterId,
        resourceName: "Sorcery Points",
        amount: 1,
        createdByLabel: "integration-test",
      });

      await performShortRest({
        characterId,
        createdByLabel: "integration-test",
      });

      const poolsAfter = await listCharacterResourcePools(characterId);
      const sorceryPointsAfter = poolsAfter.find(
        (pool) => pool.resourceName === "Sorcery Points",
      );
      expect(sorceryPointsAfter!.currentUses).toBe(sorceryPoints!.maxUses - 1);
    });
  });

  describe("long rest", () => {
    it("resets all pools (short + long rest) and records an event", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      // Spend from a short-rest pool
      await spendResource({
        characterId,
        resourceName: "Bardic Inspiration",
        amount: 1,
        createdByLabel: "integration-test",
      });

      // Long rest resets everything
      const event = await performLongRest({
        characterId,
        createdByLabel: "integration-test",
        note: "Long rest at camp",
      });

      expect(event.eventKind).toBe("long-rest-reset");
      expect(event.characterId).toBe(characterId);

      // Verify all pools back to max
      const poolsAfter = await listCharacterResourcePools(characterId);
      for (const pool of poolsAfter) {
        expect(pool.currentUses).toBe(pool.maxUses);
      }
    });
  });

  describe("event recording", () => {
    it("records spend, restore, short-rest, and long-rest events", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      // Spend
      await spendResource({
        characterId,
        resourceName: "Bardic Inspiration",
        amount: 1,
        createdByLabel: "test-spend",
      });

      // Restore
      await restoreResource({
        characterId,
        resourceName: "Bardic Inspiration",
        amount: 1,
        createdByLabel: "test-restore",
      });

      // Short rest
      await performShortRest({
        characterId,
        createdByLabel: "test-short-rest",
      });

      // Spend again then long rest
      await spendResource({
        characterId,
        resourceName: "Bardic Inspiration",
        amount: 1,
        createdByLabel: "test-spend-2",
      });

      await performLongRest({
        characterId,
        createdByLabel: "test-long-rest",
      });

      const events = await listCharacterResourceEvents(characterId);
      const eventKinds = events.map((event) => event.eventKind);

      expect(eventKinds).toContain("spend");
      expect(eventKinds).toContain("restore");
      expect(eventKinds).toContain("short-rest-reset");
      expect(eventKinds).toContain("long-rest-reset");
      expect(events.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("rest-service orchestration", () => {
    it("executeShortRest returns resource event and metadata", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      await spendResource({
        characterId,
        resourceName: "Bardic Inspiration",
        amount: 1,
        createdByLabel: "integration-test",
      });

      const result = await executeShortRest({
        characterId,
        createdByLabel: "integration-test",
      });

      expect(result.resourceEvent.eventKind).toBe("short-rest-reset");
      expect(result.hitDiceSpent).toBe(0); // not yet implemented
      expect(result.additionalEffects).toEqual([]);
    });

    it("executeLongRest returns resource event and metadata", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      await spendResource({
        characterId,
        resourceName: "Bardic Inspiration",
        amount: 1,
        createdByLabel: "integration-test",
      });

      const result = await executeLongRest({
        characterId,
        createdByLabel: "integration-test",
      });

      expect(result.resourceEvent.eventKind).toBe("long-rest-reset");
      expect(result.hitDiceRecovered).toBe(0);
      expect(result.conditionsCleared).toEqual([]);
      expect(result.additionalEffects).toEqual([]);
    });

    it("previewRestReset shows which pools would change", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      // Spend to create a gap
      await spendResource({
        characterId,
        resourceName: "Bardic Inspiration",
        amount: 1,
        createdByLabel: "integration-test",
      });

      const preview = await previewRestReset(characterId, "short");
      const bardicPreview = preview.find(
        (item) => item.resourceName === "Bardic Inspiration",
      );

      expect(bardicPreview).toBeDefined();
      expect(bardicPreview!.wouldReset).toBe(true);
      expect(bardicPreview!.currentUses).toBeLessThan(bardicPreview!.maxUses);
    });
  });

  describe("runtime state reflects rest recovery", () => {
    it("short rest recovery is visible in live character state", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      // Spend
      await spendResource({
        characterId,
        resourceName: "Bardic Inspiration",
        amount: 2,
        createdByLabel: "integration-test",
      });

      let state = await getCharacterRuntimeState(characterId);
      const bardicSpent = state?.resources.find(
        (resource) => resource.name === "Bardic Inspiration",
      );
      expect(bardicSpent?.currentUses).toBe(bardicSpent!.maxUses - 2);
      expect(bardicSpent?.isTracked).toBe(true);

      // Short rest
      await performShortRest({
        characterId,
        createdByLabel: "integration-test",
      });

      state = await getCharacterRuntimeState(characterId);
      const bardicRestored = state?.resources.find(
        (resource) => resource.name === "Bardic Inspiration",
      );
      expect(bardicRestored?.currentUses).toBe(bardicRestored!.maxUses);
      expect(bardicRestored?.isTracked).toBe(true);
    });

    it("long rest recovery is visible in live character state", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      // Spend
      await spendResource({
        characterId,
        resourceName: "Bardic Inspiration",
        amount: 1,
        createdByLabel: "integration-test",
      });

      let state = await getCharacterRuntimeState(characterId);
      const bardicSpent = state?.resources.find(
        (resource) => resource.name === "Bardic Inspiration",
      );
      expect(bardicSpent?.currentUses).toBeLessThan(bardicSpent!.maxUses);

      // Long rest
      await performLongRest({
        characterId,
        createdByLabel: "integration-test",
      });

      state = await getCharacterRuntimeState(characterId);
      const bardicRestored = state?.resources.find(
        (resource) => resource.name === "Bardic Inspiration",
      );
      expect(bardicRestored?.currentUses).toBe(bardicRestored!.maxUses);
    });
  });
});
