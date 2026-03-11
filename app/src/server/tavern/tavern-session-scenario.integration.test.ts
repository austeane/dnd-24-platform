import { beforeEach, describe, expect, it } from "vitest";
import { resetAndSeedRealCampaign } from "../test/integration-helpers.ts";
import { runTavernSessionScenario } from "./session-scenario-runner.ts";

describe("tavern session scenario", () => {
  beforeEach(async () => {
    await resetAndSeedRealCampaign();
  });

  it("publishes a session note, resolves Tavern reads, and commits a level-up", async () => {
    const result = await runTavernSessionScenario();

    expect(result.before.shell.character.slug).toBe("tali");
    expect(result.preview.totalXpCost).toBe(5);
    expect(result.before.shell.summary.level).toBe(2);
    expect(result.before.shell.spellbook.groups.length).toBeGreaterThan(0);
    expect(result.before.compendium.availablePacks).toEqual(
      expect.arrayContaining(result.before.shell.campaign.enabledPackIds),
    );
    expect(result.before.journal.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Spell notes for tonight",
        }),
      ]),
    );
    expect(result.before.playerCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Spell notes for tonight",
          refs: expect.arrayContaining([
            expect.objectContaining({
              refId: "aa-spell-hex",
              refPackId: "advanced-adventurers",
            }),
          ]),
        }),
      ]),
    );
    expect(result.before.compendium.detail).toEqual(
      expect.objectContaining({
        entityId: "aa-spell-hex",
        packId: "advanced-adventurers",
        name: "Hex",
      }),
    );
    expect(result.preview.bankedXpBefore).toBe(5);
    expect(result.preview.bankedXpAfter).toBe(0);

    expect(result.after.shell.summary.level).toBe(3);
    expect(result.after.shell.spellbook.groups.length).toBeGreaterThan(0);
    expect(result.after.shell.spellbook.castingAbility).toBe("Wisdom");
    expect(result.after.journal.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Spell notes for tonight",
        }),
      ]),
    );
    expect(result.after.compendium.detail).toEqual(
      expect.objectContaining({
        entityId: "aa-spell-hex",
        packId: "advanced-adventurers",
        name: "Hex",
      }),
    );
    expect(result.after.spendPlans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          summary: "Tali reaches Druid 3",
          state: "committed",
        }),
      ]),
    );
    expect(result.after.xpTransactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "award", amount: 5 }),
        expect.objectContaining({ category: "spend-level" }),
      ]),
    );
  });
});
