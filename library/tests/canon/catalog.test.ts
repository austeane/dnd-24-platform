import { describe, expect, it } from "vitest";
import {
  computeCharacterState,
  getCanonicalEntity,
  getCanonicalSpellByName,
} from "../../src/index.ts";
import type { CharacterComputationInput } from "../../src/types/character.ts";

describe("canonical lookup aliases", () => {
  it("resolves mixed colon and hyphen entity ids", () => {
    expect(getCanonicalEntity("srd-5e-2024", "class-feature:second-wind")?.name).toBe(
      "Second Wind",
    );
    expect(
      getCanonicalEntity("srd-5e-2024", "class-feature:druidic-spellcasting-2")?.name,
    ).toBe("Druidic Spellcasting (Level 2)");
    expect(getCanonicalEntity("srd-5e-2024", "feat:musician")?.name).toBe("Musician");
  });

  it("finds roster-critical spells by visible sheet names", () => {
    expect(getCanonicalSpellByName("Tasha's Hideous Laughter")?.id).toBe(
      "spell-hideous-laughter",
    );
    expect(getCanonicalSpellByName("Toll the Dead")?.id).toBe("spell-toll-the-dead");
  });
});

describe("spellcasting runtime", () => {
  it("builds slot pools and merges duplicate spell access from multiple sources", () => {
    const input: CharacterComputationInput = {
      base: {
        name: "Vivennah",
        progressionMode: "hybrid",
        abilityScores: {
          strength: 8,
          dexterity: 18,
          constitution: 14,
          intelligence: 12,
          wisdom: 10,
          charisma: 17,
        },
        baseArmorClass: 13,
        baseMaxHP: 15,
        baseSpeed: 30,
        spellcastingAbility: "charisma",
      },
      sources: [
        {
          source: {
            id: "class-level-bard",
            kind: "class-level",
            name: "Bard 2",
            entityId: "class:bard",
            packId: "srd-5e-2024",
            payload: { levelsGranted: 2 },
          },
          effects: [],
        },
        {
          source: {
            id: "bard-spellcasting",
            kind: "class-feature",
            name: "Bard Spellcasting (Level 2)",
          },
          effects: [
            {
              type: "grant-spell-slots",
              pool: {
                slots: [3],
                resetOn: "long",
                source: "Spellcasting",
              },
            },
            {
              type: "grant-spell-access",
              spell: {
                spellName: "Druidcraft",
                spellEntityId: "spell-druidcraft",
                spellPackId: "srd-5e-2024",
                alwaysPrepared: false,
                source: "Bard spell list",
              },
            },
          ],
        },
        {
          source: {
            id: "wood-elf",
            kind: "species",
            name: "Wood Elf",
          },
          effects: [
            {
              type: "speed-bonus",
              value: 5,
              movementType: "walk",
            },
            {
              type: "grant-spell-access",
              spell: {
                spellName: "Druidcraft",
                spellEntityId: "spell-druidcraft",
                spellPackId: "srd-5e-2024",
                alwaysPrepared: true,
                source: "Wood Elf Lineage",
              },
            },
          ],
        },
      ],
      xpLedger: [],
    };

    const state = computeCharacterState(input);

    expect(state.speed).toBe(35);
    expect(state.spellcasting?.slotPools).toEqual([
      {
        sourceName: "Bard Spellcasting (Level 2)",
        source: "Spellcasting",
        resetOn: "long",
        slots: [{ level: 1, total: 3 }],
      },
    ]);
    expect(state.spellcasting?.grantedSpells).toEqual([
      {
        spellName: "Druidcraft",
        spellEntityId: "spell-druidcraft",
        spellPackId: "srd-5e-2024",
        alwaysPrepared: true,
        source: "Bard spell list, Wood Elf Lineage",
      },
    ]);
  });
});
