import { canAttackTarget, canTakeActions, canTakeReactions } from "@dnd/library";
import { beforeEach, describe, expect, it } from "vitest";
import { getCampaignBySlug, listCampaignRoster } from "../campaigns/index.ts";
import { resetAndSeedRealCampaign } from "../test/integration-helpers.ts";
import { getCharacterRuntimeState } from "./character-state.ts";
import { executeLongRest } from "./rest-service.ts";
import {
  applyConditionWithEffects,
  getActiveConditionsWithEffects,
  overrideConditionWithEffects,
  removeConditionWithEffects,
} from "./condition-service.ts";
import {
  applyCondition,
  listActiveConditions,
  listConditionEvents,
  overrideCondition,
  removeCondition,
} from "./condition-state.ts";

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

describe("condition state persistence", () => {
  beforeEach(async () => {
    await resetAndSeedRealCampaign();
  });

  describe("apply/remove round-trip", () => {
    it("applies a condition and reads it back as active", async () => {
      const characterId = await getRosterCharacterId("ronan-wildspark");

      const applied = await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Vampire Lord",
        appliedByLabel: "DM",
        note: "Charmed by vampire gaze",
      });

      expect(applied.conditionName).toBe("charmed");
      expect(applied.sourceCreature).toBe("Vampire Lord");
      expect(applied.appliedByLabel).toBe("DM");
      expect(applied.note).toBe("Charmed by vampire gaze");
      expect(applied.removedAt).toBeNull();

      const active = await listActiveConditions(characterId);
      expect(active).toHaveLength(1);
      expect(active[0]!.id).toBe(applied.id);
      expect(active[0]!.conditionName).toBe("charmed");
    });

    it("removes a condition and confirms it is no longer active", async () => {
      const characterId = await getRosterCharacterId("ronan-wildspark");

      const applied = await applyCondition({
        characterId,
        conditionName: "incapacitated",
        appliedByLabel: "DM",
      });

      const removed = await removeCondition({
        conditionId: applied.id,
        removedByLabel: "DM",
        note: "Recovered",
      });

      expect(removed.removedAt).not.toBeNull();
      expect(removed.removedByLabel).toBe("DM");

      const active = await listActiveConditions(characterId);
      expect(active).toHaveLength(0);
    });

    it("supports multiple conditions on one character", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Succubus",
        appliedByLabel: "DM",
      });

      await applyCondition({
        characterId,
        conditionName: "incapacitated",
        appliedByLabel: "DM",
      });

      const active = await listActiveConditions(characterId);
      expect(active).toHaveLength(2);
      expect(active.map((c) => c.conditionName).sort()).toEqual([
        "charmed",
        "incapacitated",
      ]);
    });

    it("stores concentration as an active tracked state", async () => {
      const characterId = await getRosterCharacterId("tali");

      const applied = await applyConditionWithEffects({
        characterId,
        conditionName: "concentration",
        appliedByLabel: "DM",
        note: "Entangle",
      });

      expect(applied.condition.conditionName).toBe("concentration");
      expect(applied.mechanicalEffects).toEqual([
        "Maintaining concentration: Entangle",
      ]);

      const active = await listActiveConditions(characterId);
      expect(active).toHaveLength(1);
      expect(active[0]!.conditionName).toBe("concentration");
    });

    it("errors when removing an already-removed condition", async () => {
      const characterId = await getRosterCharacterId("ronan-wildspark");

      const applied = await applyCondition({
        characterId,
        conditionName: "charmed",
        appliedByLabel: "DM",
      });

      await removeCondition({
        conditionId: applied.id,
        removedByLabel: "DM",
      });

      await expect(
        removeCondition({
          conditionId: applied.id,
          removedByLabel: "DM",
        }),
      ).rejects.toThrow("not found or already removed");
    });
  });

  describe("DM override flows", () => {
    it("overrides a condition by removing it (no replacement)", async () => {
      const characterId = await getRosterCharacterId("tali");

      const applied = await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Goblin Shaman",
        appliedByLabel: "DM",
      });

      const result = await overrideCondition({
        conditionId: applied.id,
        correctedByLabel: "DM",
        note: "DM correction: charm was resisted",
      });

      expect(result.removed.id).toBe(applied.id);
      expect(result.removed.removedAt).not.toBeNull();
      expect(result.replacement).toBeNull();

      const active = await listActiveConditions(characterId);
      expect(active).toHaveLength(0);
    });

    it("overrides a condition with a replacement", async () => {
      const characterId = await getRosterCharacterId("tali");

      const applied = await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Goblin Shaman",
        appliedByLabel: "DM",
      });

      const result = await overrideCondition({
        conditionId: applied.id,
        correctedByLabel: "DM",
        note: "DM correction: was actually incapacitated",
        replacement: {
          conditionName: "incapacitated",
          note: "Corrected from charmed to incapacitated",
        },
      });

      expect(result.removed.id).toBe(applied.id);
      expect(result.replacement).not.toBeNull();
      expect(result.replacement!.conditionName).toBe("incapacitated");

      const active = await listActiveConditions(characterId);
      expect(active).toHaveLength(1);
      expect(active[0]!.conditionName).toBe("incapacitated");
    });

    it("override with effects reports removed and applied effects", async () => {
      const characterId = await getRosterCharacterId("oriana");

      const applied = await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Mind Flayer",
        appliedByLabel: "DM",
      });

      const result = await overrideConditionWithEffects({
        conditionId: applied.id,
        correctedByLabel: "DM",
        note: "Actually incapacitated",
        replacement: {
          conditionName: "incapacitated",
        },
      });

      expect(result.effectsRemoved.length).toBeGreaterThan(0);
      expect(result.effectsApplied.length).toBeGreaterThan(0);
      expect(result.effectsRemoved.some((e) => e.includes("Mind Flayer"))).toBe(true);
      expect(result.effectsApplied.some((e) => e.includes("actions"))).toBe(true);
    });
  });

  describe("audit trail (events)", () => {
    it("records apply and remove events with timestamps", async () => {
      const characterId = await getRosterCharacterId("nara");

      const applied = await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Dryad",
        appliedByLabel: "DM",
        sessionId: null,
      });

      await removeCondition({
        conditionId: applied.id,
        removedByLabel: "DM",
        note: "Charm ended",
      });

      const events = await listConditionEvents(characterId);
      expect(events).toHaveLength(2);

      const applyEvent = events.find((e) => e.eventKind === "apply");
      const removeEvent = events.find((e) => e.eventKind === "remove");

      expect(applyEvent).toBeDefined();
      expect(applyEvent!.conditionName).toBe("charmed");
      expect(applyEvent!.createdByLabel).toBe("DM");
      expect(applyEvent!.createdAt).toBeInstanceOf(Date);

      expect(removeEvent).toBeDefined();
      expect(removeEvent!.conditionName).toBe("charmed");
      expect(removeEvent!.createdByLabel).toBe("DM");
      expect(removeEvent!.createdAt).toBeInstanceOf(Date);
    });

    it("records override events with timestamps", async () => {
      const characterId = await getRosterCharacterId("nara");

      const applied = await applyCondition({
        characterId,
        conditionName: "charmed",
        appliedByLabel: "DM",
      });

      await overrideCondition({
        conditionId: applied.id,
        correctedByLabel: "DM",
        note: "DM override",
        replacement: {
          conditionName: "incapacitated",
        },
      });

      const events = await listConditionEvents(characterId);
      // apply(charmed) + override(charmed) + apply(incapacitated)
      expect(events).toHaveLength(3);

      const overrideEvent = events.find((e) => e.eventKind === "override");
      expect(overrideEvent).toBeDefined();
      expect(overrideEvent!.conditionName).toBe("charmed");
      expect(overrideEvent!.createdByLabel).toBe("DM");
      expect(overrideEvent!.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("charmed mechanical effects in runtime", () => {
    it("charmed condition appears in runtime state with effects", async () => {
      const characterId = await getRosterCharacterId("ronan-wildspark");

      await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Vampire Lord",
        appliedByLabel: "DM",
      });

      const state = await getCharacterRuntimeState(characterId);
      expect(state).not.toBeNull();

      expect(state!.conditions.active).toHaveLength(1);
      expect(state!.conditions.active[0]!.conditionName).toBe("charmed");
      expect(state!.conditions.active[0]!.sourceCreature).toBe("Vampire Lord");

      expect(state!.conditions.effects.length).toBeGreaterThan(0);
      const attackRestriction = state!.conditions.effects.find((e) =>
        e.tags.includes("attack-restriction"),
      );
      expect(attackRestriction).toBeDefined();
      expect(attackRestriction!.description).toContain("Vampire Lord");
    });

    it("charmed prevents attacking the charmer", async () => {
      const characterId = await getRosterCharacterId("ronan-wildspark");

      await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Vampire Lord",
        appliedByLabel: "DM",
      });

      const state = await getCharacterRuntimeState(characterId);
      const active = state!.conditions.active;

      expect(canAttackTarget(active, "Vampire Lord")).toBe(false);
      expect(canAttackTarget(active, "Goblin")).toBe(true);
    });

    it("charmed grants social advantage to the charmer", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Succubus",
        appliedByLabel: "DM",
      });

      const state = await getCharacterRuntimeState(characterId);
      const socialEffect = state!.conditions.effects.find((e) =>
        e.tags.includes("social"),
      );
      expect(socialEffect).toBeDefined();
      expect(socialEffect!.description).toContain("advantage");
      expect(socialEffect!.description).toContain("Succubus");
    });
  });

  describe("incapacitated mechanical effects in runtime", () => {
    it("incapacitated condition prevents actions and reactions", async () => {
      const characterId = await getRosterCharacterId("tali");

      await applyCondition({
        characterId,
        conditionName: "incapacitated",
        appliedByLabel: "DM",
        note: "Stunned by mind blast",
      });

      const state = await getCharacterRuntimeState(characterId);
      expect(state).not.toBeNull();

      expect(state!.conditions.active).toHaveLength(1);
      expect(state!.conditions.active[0]!.conditionName).toBe("incapacitated");

      expect(canTakeActions(state!.conditions.active)).toBe(false);
      expect(canTakeReactions(state!.conditions.active)).toBe(false);
    });

    it("incapacitated breaks concentration", async () => {
      const characterId = await getRosterCharacterId("oriana");

      await applyConditionWithEffects({
        characterId,
        conditionName: "concentration",
        appliedByLabel: "DM",
        note: "Hex",
      });

      await applyConditionWithEffects({
        characterId,
        conditionName: "incapacitated",
        appliedByLabel: "DM",
      });

      const state = await getCharacterRuntimeState(characterId);
      expect(
        state!.conditions.active.map((condition) => condition.conditionName),
      ).not.toContain("concentration");
      const concentrationEffect = state!.conditions.effects.find((e) =>
        e.tags.includes("concentration-broken"),
      );
      expect(concentrationEffect).toBeDefined();
      expect(concentrationEffect!.description).toContain("Concentration");
    });

    it("incapacitated restricts actions, bonus actions, and reactions", async () => {
      const characterId = await getRosterCharacterId("nara");

      await applyCondition({
        characterId,
        conditionName: "incapacitated",
        appliedByLabel: "DM",
      });

      const state = await getCharacterRuntimeState(characterId);
      const actionEffect = state!.conditions.effects.find((e) =>
        e.tags.includes("action-restriction"),
      );
      expect(actionEffect).toBeDefined();
      expect(actionEffect!.tags).toContain("bonus-action-restriction");
      expect(actionEffect!.tags).toContain("reaction-restriction");
    });
  });

  describe("condition service with effects", () => {
    it("applyConditionWithEffects returns mechanical effects", async () => {
      const characterId = await getRosterCharacterId("ronan-wildspark");

      const result = await applyConditionWithEffects({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Vampire Lord",
        appliedByLabel: "DM",
      });

      expect(result.condition.conditionName).toBe("charmed");
      expect(result.mechanicalEffects).toHaveLength(2);
      expect(result.mechanicalEffects.some((e) => e.includes("Vampire Lord"))).toBe(true);
    });

    it("removeConditionWithEffects returns removed effects", async () => {
      const characterId = await getRosterCharacterId("vivennah");

      const { condition } = await applyConditionWithEffects({
        characterId,
        conditionName: "incapacitated",
        appliedByLabel: "DM",
      });

      const result = await removeConditionWithEffects({
        conditionId: condition.id,
        removedByLabel: "DM",
      });

      expect(result.condition.removedAt).not.toBeNull();
      expect(result.effectsRemoved).toHaveLength(2);
      expect(result.effectsRemoved.some((e) => e.includes("actions"))).toBe(true);
    });

    it("getActiveConditionsWithEffects lists all with effects", async () => {
      const characterId = await getRosterCharacterId("tali");

      await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Dryad",
        appliedByLabel: "DM",
      });

      await applyCondition({
        characterId,
        conditionName: "incapacitated",
        appliedByLabel: "DM",
      });

      const results = await getActiveConditionsWithEffects(characterId);
      expect(results).toHaveLength(2);

      const charmedEntry = results.find(
        (r) => r.condition.conditionName === "charmed",
      );
      expect(charmedEntry).toBeDefined();
      expect(charmedEntry!.mechanicalEffects).toHaveLength(2);

      const incapEntry = results.find(
        (r) => r.condition.conditionName === "incapacitated",
      );
      expect(incapEntry).toBeDefined();
      expect(incapEntry!.mechanicalEffects).toHaveLength(2);
    });

    it("replaces an existing concentration state when a new one starts", async () => {
      const characterId = await getRosterCharacterId("tali");

      await applyConditionWithEffects({
        characterId,
        conditionName: "concentration",
        appliedByLabel: "DM",
        note: "Entangle",
      });

      await applyConditionWithEffects({
        characterId,
        conditionName: "concentration",
        appliedByLabel: "DM",
        note: "Hex",
      });

      const active = await listActiveConditions(characterId);
      expect(active).toHaveLength(1);
      expect(active[0]!.conditionName).toBe("concentration");
      expect(active[0]!.note).toBe("Hex");
    });

    it("long rest clears active concentration", async () => {
      const characterId = await getRosterCharacterId("tali");

      await applyConditionWithEffects({
        characterId,
        conditionName: "concentration",
        appliedByLabel: "DM",
        note: "Entangle",
      });

      const result = await executeLongRest({
        characterId,
        createdByLabel: "DM",
      });

      expect(result.conditionsCleared).toContain("concentration");
      const active = await listActiveConditions(characterId);
      expect(active).toHaveLength(0);
    });
  });

  describe("condition removal clears runtime state", () => {
    it("removing all conditions restores clean state", async () => {
      const characterId = await getRosterCharacterId("ronan-wildspark");

      const charmed = await applyCondition({
        characterId,
        conditionName: "charmed",
        sourceCreature: "Vampire Lord",
        appliedByLabel: "DM",
      });

      const incapacitated = await applyCondition({
        characterId,
        conditionName: "incapacitated",
        appliedByLabel: "DM",
      });

      let state = await getCharacterRuntimeState(characterId);
      expect(state!.conditions.active).toHaveLength(2);
      expect(state!.conditions.effects).toHaveLength(4);

      await removeCondition({
        conditionId: charmed.id,
        removedByLabel: "DM",
      });

      await removeCondition({
        conditionId: incapacitated.id,
        removedByLabel: "DM",
      });

      state = await getCharacterRuntimeState(characterId);
      expect(state!.conditions.active).toHaveLength(0);
      expect(state!.conditions.effects).toHaveLength(0);
    });
  });
});
