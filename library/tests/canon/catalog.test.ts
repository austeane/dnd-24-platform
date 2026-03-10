import { describe, expect, it } from "vitest";
import {
  allCanonSpells,
  computeCharacterState,
  getCanonicalEntity,
  getCanonicalSpellByName,
  listPackVisibleSpells,
} from "../../src/index.ts";
import type { PackId } from "../../src/canon/types.ts";
import type { CharacterComputationInput } from "../../src/types/character.ts";

const srd: PackId = "srd-5e-2024";
const aa: PackId = "advanced-adventurers";

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

// ---------------------------------------------------------------------------
// spell-lookup-by-id: Spell lookup by canonical entity ID
// ---------------------------------------------------------------------------

describe("spell lookup by canonical id", () => {
  it("resolves spell by hyphenated entity ID", () => {
    const spell = getCanonicalEntity(srd, "spell-hex");
    expect(spell).toBeDefined();
    expect(spell?.name).toBe("Hex");
    expect(spell?.type).toBe("spell");
  });

  it("spell IDs use hyphen format only (no colon prefix normalization)", () => {
    // Spells use bare IDs like "spell-hex" — the colon-prefix normalization
    // only covers class, class-feature, feat, equipment, and species types.
    const spell = getCanonicalEntity(srd, "spell:hex");
    expect(spell).toBeUndefined();
  });

  it("resolves cantrip by ID (Dancing Lights)", () => {
    const spell = getCanonicalEntity(srd, "spell-dancing-lights");
    expect(spell).toBeDefined();
    expect(spell?.name).toBe("Dancing Lights");
    expect(spell?.type).toBe("spell");
  });

  it("returns undefined for nonexistent spell ID", () => {
    const spell = getCanonicalEntity(srd, "spell-nonexistent");
    expect(spell).toBeUndefined();
  });

  it("every SRD spell entity has a valid id and name", () => {
    const srdSpells = allCanonSpells.filter((s) => s.packId === srd);
    expect(srdSpells.length).toBeGreaterThanOrEqual(20);
    for (const spell of srdSpells) {
      expect(spell.id, `spell ${spell.name} has no id`).toBeTruthy();
      expect(spell.name, `spell ${spell.id} has no name`).toBeTruthy();
      const resolved = getCanonicalEntity(srd, spell.id);
      expect(resolved, `spell ${spell.id} not resolvable`).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// spell-lookup-by-name-alias: Spell lookup by display name / alias
// ---------------------------------------------------------------------------

describe("spell lookup by name alias", () => {
  it("resolves Tasha's Hideous Laughter via legacy name alias", () => {
    const spell = getCanonicalSpellByName("Tasha's Hideous Laughter");
    expect(spell).toBeDefined();
    expect(spell?.id).toBe("spell-hideous-laughter");
    expect(spell?.name).toBe("Hideous Laughter");
  });

  it("resolves a spell by exact display name", () => {
    const spell = getCanonicalSpellByName("Cure Wounds");
    expect(spell).toBeDefined();
    expect(spell?.id).toBe("spell-cure-wounds");
  });

  it("is case-insensitive for name lookup", () => {
    const spell = getCanonicalSpellByName("cure wounds");
    expect(spell).toBeDefined();
    expect(spell?.name).toBe("Cure Wounds");
  });

  it("trims whitespace from input", () => {
    const spell = getCanonicalSpellByName("  Hex  ");
    expect(spell).toBeDefined();
    expect(spell?.name).toBe("Hex");
  });

  it("returns undefined for unknown spell name", () => {
    const spell = getCanonicalSpellByName("Nonexistent Spell");
    expect(spell).toBeUndefined();
  });

  it("with both packs enabled, AA overlay takes priority over SRD base for Eldritch Blast", () => {
    const spell = getCanonicalSpellByName("Eldritch Blast", [srd, aa]);
    expect(spell).toBeDefined();
    expect(spell?.packId).toBe(aa);
  });

  it("with only SRD enabled, Eldritch Blast resolves from SRD", () => {
    const spell = getCanonicalSpellByName("Eldritch Blast", [srd]);
    expect(spell).toBeDefined();
    expect(spell?.packId).toBe(srd);
  });
});

// ---------------------------------------------------------------------------
// spell-enabled-pack-visibility: Pack-filtered spell visibility
// ---------------------------------------------------------------------------

describe("enabled-pack spell visibility", () => {
  it("SRD-only mode returns only SRD spells", () => {
    const spells = listPackVisibleSpells([srd]);
    expect(spells.length).toBeGreaterThan(0);
    for (const spell of spells) {
      expect(spell.packId).toBe(srd);
    }
  });

  it("AA-only mode returns only AA spells", () => {
    const spells = listPackVisibleSpells([aa]);
    expect(spells.length).toBeGreaterThan(0);
    for (const spell of spells) {
      expect(spell.packId).toBe(aa);
    }
  });

  it("enabling both packs returns AA overlay over SRD base for overlapping spells", () => {
    const bothPacks = listPackVisibleSpells([srd, aa]);
    const eldritchBlast = bothPacks.find((s) => s.name === "Eldritch Blast");
    expect(eldritchBlast).toBeDefined();
    expect(eldritchBlast?.packId).toBe(aa);
  });

  it("enabling both packs does not duplicate spells with overlays", () => {
    const bothPacks = listPackVisibleSpells([srd, aa]);
    const eldritchBlastEntries = bothPacks.filter(
      (s) => s.name.toLowerCase() === "eldritch blast",
    );
    expect(eldritchBlastEntries).toHaveLength(1);
  });

  it("spells from disabled packs are not included", () => {
    const srdOnly = listPackVisibleSpells([srd]);
    const aaSpells = srdOnly.filter((s) => s.packId === aa);
    expect(aaSpells).toHaveLength(0);
  });

  it("result is sorted alphabetically by name", () => {
    const spells = listPackVisibleSpells([srd, aa]);
    for (let i = 1; i < spells.length; i++) {
      const prev = spells[i - 1]!;
      const curr = spells[i]!;
      expect(
        prev.name.localeCompare(curr.name),
        `${prev.name} should come before ${curr.name}`,
      ).toBeLessThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// spell-roster-canon-coverage: Every roster spell resolves in the catalog
// ---------------------------------------------------------------------------

describe("roster spell canon coverage", () => {
  /** All spells from the verified-characters.json knownSpells arrays */
  const rosterSpells = [
    // Tali (Druid)
    "Shillelagh",
    "Druidcraft",
    "Guidance",
    "Message",
    "Hex",
    "Entangle",
    "Cure Wounds",
    "Faerie Fire",
    "Detect Magic",
    "Jump",
    "Disguise Self",
    // Oriana (Warlock)
    "Dancing Lights",
    "Eldritch Blast",
    "Toll the Dead",
    "Hellish Rebuke",
    // Vivennah (Bard)
    "True Strike",
    "Vicious Mockery",
    "Speak with Animals",
    "Tasha's Hideous Laughter",
    "Thunderwave",
  ];

  for (const spellName of rosterSpells) {
    it(`roster spell "${spellName}" resolves via getCanonicalSpellByName`, () => {
      const spell = getCanonicalSpellByName(spellName, [srd, aa]);
      expect(spell, `could not resolve roster spell: ${spellName}`).toBeDefined();
      expect(spell?.name).toBeTruthy();
    });
  }

  it("all roster spells resolve (batch assertion)", () => {
    const missing: string[] = [];
    for (const spellName of rosterSpells) {
      const spell = getCanonicalSpellByName(spellName, [srd, aa]);
      if (!spell) {
        missing.push(spellName);
      }
    }
    expect(missing, `unresolved roster spells: ${missing.join(", ")}`).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// rules-concentration-canon-linkage: Concentration flag on spells
// ---------------------------------------------------------------------------

describe("concentration canon linkage", () => {
  const concentrationSpells = [
    { name: "Hex", expected: true },
    { name: "Faerie Fire", expected: true },
    { name: "Entangle", expected: true },
    { name: "Detect Magic", expected: true },
    { name: "Dancing Lights", expected: true },
    { name: "Guidance", expected: true },
  ];

  const nonConcentrationSpells = [
    { name: "Cure Wounds", expected: false },
    { name: "Thunderwave", expected: false },
    { name: "Hellish Rebuke", expected: false },
    { name: "Jump", expected: false },
  ];

  for (const { name, expected } of concentrationSpells) {
    it(`${name} is marked as concentration=${expected}`, () => {
      const spell = getCanonicalSpellByName(name, [srd, aa]);
      expect(spell).toBeDefined();
      if (spell?.type === "spell") {
        expect(spell.concentration).toBe(expected);
      }
    });
  }

  for (const { name, expected } of nonConcentrationSpells) {
    it(`${name} is marked as concentration=${expected}`, () => {
      const spell = getCanonicalSpellByName(name, [srd, aa]);
      expect(spell).toBeDefined();
      if (spell?.type === "spell") {
        expect(spell.concentration).toBe(expected);
      }
    });
  }

  it("every SRD spell has a boolean concentration field", () => {
    const srdSpells = allCanonSpells.filter((s) => s.packId === srd);
    for (const spell of srdSpells) {
      expect(
        typeof spell.concentration,
        `spell ${spell.name} missing concentration field`,
      ).toBe("boolean");
    }
  });

  it("concentration rule entity exists in canonical catalog", () => {
    const rule = getCanonicalEntity(srd, "rule-concentration");
    expect(rule).toBeDefined();
    expect(rule?.name).toBe("Concentration");
    expect(rule?.type).toBe("rule");
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
