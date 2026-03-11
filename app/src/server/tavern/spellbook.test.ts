import { describe, expect, it, vi } from "vitest";
import type { CharacterSpellcastingState } from "@dnd/library";
vi.mock("./context.ts", () => ({
  getTavernCharacterContext: vi.fn(),
  isCanonicalPackId: (packId: string | undefined) =>
    packId === "srd-5e-2024" ||
    packId === "advanced-adventurers" ||
    packId === "campaign-private",
  toCanonicalPackIds: (enabledPackIds: string[]) =>
    enabledPackIds.filter((packId) =>
      [
        "srd-5e-2024",
        "advanced-adventurers",
        "campaign-private",
      ].includes(packId)
    ),
}));
import { buildSpellbookData } from "./spellbook.ts";

function createSpellcastingState(): CharacterSpellcastingState {
  return {
    ability: "wisdom",
    grantedSpells: [
      {
        spellName: "Hex",
        spellEntityId: "aa-spell-hex",
        spellPackId: "advanced-adventurers",
        alwaysPrepared: true,
        source: "Circle feature",
      },
      {
        spellName: "Entangle",
        spellEntityId: "spell-entangle",
        spellPackId: "srd-5e-2024",
        alwaysPrepared: false,
        source: "Druid Spellcasting",
      },
    ],
    grantedSpellNames: ["Hex", "Entangle"],
    slotPools: [
      {
        sourceName: "Druid Spellcasting",
        source: "Spellcasting",
        resetOn: "long",
        slots: [
          { level: 1, total: 3, current: 2 },
          { level: 2, total: 2, current: 2 },
        ],
      },
    ],
    capacities: [],
    spellAttackBonus: 5,
    spellAttackExplanation: { total: 5, contributors: [] },
    spellSaveDc: 13,
    spellSaveExplanation: { total: 13, contributors: [] },
  };
}

describe("buildSpellbookData", () => {
  it("returns an empty spellbook for non-casters", () => {
    expect(buildSpellbookData(undefined, ["srd-5e-2024"])).toEqual({
      castingAbility: null,
      spellSaveDC: null,
      spellAttackBonus: null,
      groups: [],
    });
  });

  it("prefers granted spell identity inside the campaign-enabled packs", () => {
    const data = buildSpellbookData({
      spellcasting: createSpellcastingState(),
      resources: [],
    }, [
      "srd-5e-2024",
      "advanced-adventurers",
    ]);

    expect(data.castingAbility).toBe("Wisdom");
    expect(data.groups.find((group) => group.level === 1)?.spells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Hex",
          school: "Enchantment",
          alwaysPrepared: true,
        }),
        expect.objectContaining({
          name: "Entangle",
          school: "Conjuration",
          alwaysPrepared: false,
        }),
      ]),
    );
    expect(data.groups.find((group) => group.level === 2)?.slots[0]).toMatchObject({
      total: 2,
      current: 2,
    });
  });
});
