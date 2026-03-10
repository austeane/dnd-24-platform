import { describe, expect, it } from "vitest";
import { getCanonicalEntity } from "../../src/index.ts";
import type {
  CanonicalAAAbility,
  CanonicalSpell,
  PackId,
} from "../../src/canon/types.ts";

const aa: PackId = "advanced-adventurers";
const srd: PackId = "srd-5e-2024";

/**
 * These tests verify that the AA overlay and AA ability canonical content
 * compiles correctly, resolves via catalog lookup, and maintains proper
 * overlay linkage to SRD base entities.
 *
 * Roster: Ronan (Fighter), Tali (Druid), Oriana (Warlock),
 *         Vivennah (Bard), Nara (Sorcerer).
 */

describe("existing AA spell overlays", () => {
  const overlays = [
    { id: "aa-spell-eldritch-blast", name: "Eldritch Blast", srdId: "spell-eldritch-blast" },
    { id: "aa-spell-animate-dead", name: "Animate Dead", srdId: "spell-animate-dead" },
    { id: "aa-spell-counterspell", name: "Counterspell", srdId: "spell-counterspell" },
    { id: "aa-spell-mage-hand", name: "Mage Hand", srdId: "spell-mage-hand" },
    { id: "aa-spell-minor-illusion", name: "Minor Illusion", srdId: "spell-minor-illusion" },
  ];

  for (const { id, name, srdId } of overlays) {
    it(`resolves ${name} AA overlay and its SRD base`, () => {
      const aaSpell = getCanonicalEntity(aa, id) as CanonicalSpell | undefined;
      expect(aaSpell).toBeDefined();
      expect(aaSpell?.name).toBe(name);
      expect(aaSpell?.type).toBe("spell");
      expect(aaSpell?.overlayTarget?.packId).toBe(srd);
      expect(aaSpell?.overlayTarget?.entityId).toBe(srdId);

      const srdSpell = getCanonicalEntity(srd, srdId);
      expect(srdSpell).toBeDefined();
      expect(srdSpell?.name).toBe(name);
    });
  }
});

describe("new AA spell overlays", () => {
  it("resolves Hex AA overlay with SRD base linkage", () => {
    const aaSpell = getCanonicalEntity(aa, "aa-spell-hex") as CanonicalSpell | undefined;
    expect(aaSpell).toBeDefined();
    expect(aaSpell?.name).toBe("Hex");
    expect(aaSpell?.availability).toBe("aa-universal");
    expect(aaSpell?.overlayTarget?.packId).toBe(srd);
    expect(aaSpell?.overlayTarget?.entityId).toBe("spell-hex");

    const srdSpell = getCanonicalEntity(srd, "spell-hex");
    expect(srdSpell).toBeDefined();
  });

  it("resolves Find Familiar AA overlay with judgement metadata", () => {
    const aaSpell = getCanonicalEntity(aa, "aa-spell-find-familiar") as CanonicalSpell | undefined;
    expect(aaSpell).toBeDefined();
    expect(aaSpell?.name).toBe("Find Familiar");
    expect(aaSpell?.overlayTarget?.packId).toBe(srd);
    expect(aaSpell?.overlayTarget?.entityId).toBe("spell-find-familiar");
    expect(aaSpell?.judgement?.isJudgementCall).toBe(true);
    expect(aaSpell?.linkedAaAbilityIds).toContain("aa-ability-pact-of-the-chain");
  });
});

describe("existing AA abilities", () => {
  const existingAbilities = [
    { id: "aa-ability-agonizing-blast", name: "Agonizing Blast", expCost: 0 },
    { id: "aa-ability-improved-abjuration", name: "Improved Abjuration", expCost: 4 },
    { id: "aa-ability-improved-minor-illusion", name: "Improved Minor Illusion", expCost: 2 },
    { id: "aa-ability-mage-hand-legerdemain", name: "Mage Hand Legerdemain", expCost: 3 },
    { id: "aa-ability-spell-stealer", name: "Spell Stealer", expCost: 8 },
    { id: "aa-ability-undead-thralls", name: "Undead Thralls", expCost: 12 },
  ];

  for (const { id, name, expCost } of existingAbilities) {
    it(`resolves ${name} (${expCost} exp)`, () => {
      const ability = getCanonicalEntity(aa, id) as CanonicalAAAbility | undefined;
      expect(ability).toBeDefined();
      expect(ability?.name).toBe(name);
      expect(ability?.type).toBe("aa-ability");
      expect(ability?.expCost).toBe(expCost);
    });
  }
});

describe("roster-critical AA abilities (Nara - Sorcerer)", () => {
  it("resolves Font of Magic", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-font-of-magic") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Font of Magic");
    expect(ability?.expCost).toBe(5);
    expect(ability?.category).toBe("ability-tree");
  });

  it("resolves Metamagic with Font of Magic prerequisite", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-metamagic") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Metamagic");
    expect(ability?.expCost).toBe(6);
    expect(ability?.repeatable).toBe(true);
    expect(ability?.prerequisites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "ability", value: "Font of Magic" }),
      ]),
    );
  });
});

describe("roster-critical AA abilities (Vivennah - Bard)", () => {
  it("resolves Bardic Inspiration", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-bardic-inspiration") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Bardic Inspiration");
    expect(ability?.expCost).toBe(8);
    expect(ability?.category).toBe("ability-tree");
  });

  it("resolves Cutting Words with Bardic Inspiration prerequisite", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-cutting-words") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Cutting Words");
    expect(ability?.expCost).toBe(6);
    expect(ability?.prerequisites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "ability", value: "Bardic Inspiration" }),
      ]),
    );
  });

  it("resolves Font of Inspiration with Bardic Inspiration prerequisite", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-font-of-inspiration") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Font of Inspiration");
    expect(ability?.expCost).toBe(5);
  });

  it("resolves Combat Inspiration with Bardic Inspiration prerequisite", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-combat-inspiration") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Combat Inspiration");
    expect(ability?.expCost).toBe(5);
  });
});

describe("roster-critical AA abilities (Oriana - Warlock)", () => {
  it("resolves Pact of the Blade", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-pact-of-the-blade") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Pact of the Blade");
    expect(ability?.expCost).toBe(6);
    expect(ability?.prerequisites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "ability", value: "Otherworldly Patron" }),
      ]),
    );
  });

  it("resolves Pact of the Chain", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-pact-of-the-chain") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Pact of the Chain");
    expect(ability?.expCost).toBe(4);
  });

  it("resolves Eldritch Invocations", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-eldritch-invocations") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Eldritch Invocations");
    expect(ability?.expCost).toBe(17);
    expect(ability?.repeatable).toBe(true);
  });

  it("resolves Repelling Blast invocation", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-repelling-blast") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Repelling Blast");
    expect(ability?.expCost).toBe(0);
  });

  it("resolves Devil's Sight invocation", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-devils-sight") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Devil's Sight");
    expect(ability?.expCost).toBe(0);
  });
});

describe("roster-critical AA abilities (Ronan - Fighter / general)", () => {
  it("resolves Action Surge", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-action-surge") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Action Surge");
    expect(ability?.expCost).toBe(12);
    expect(ability?.category).toBe("general-utility");
  });

  it("resolves Fighting Style", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-fighting-style") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Fighting Style");
    expect(ability?.expCost).toBe(8);
    expect(ability?.repeatable).toBe(true);
  });

  it("resolves Extra Attack", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-extra-attack") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Extra Attack");
    expect(ability?.expCost).toBe(30);
    expect(ability?.repeatable).toBe(true);
  });
});

describe("general defensive AA abilities", () => {
  it("resolves Evasion", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-evasion") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Evasion");
    expect(ability?.expCost).toBe(13);
    expect(ability?.category).toBe("defensive");
  });

  it("resolves Uncanny Dodge", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-uncanny-dodge") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Uncanny Dodge");
    expect(ability?.expCost).toBe(15);
  });

  it("resolves Divine Smite", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-divine-smite") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Divine Smite");
    expect(ability?.expCost).toBe(12);
    expect(ability?.category).toBe("offensive-combat");
  });

  it("resolves Cunning Action", () => {
    const ability = getCanonicalEntity(aa, "aa-ability-cunning-action") as CanonicalAAAbility | undefined;
    expect(ability).toBeDefined();
    expect(ability?.name).toBe("Cunning Action");
    expect(ability?.expCost).toBe(12);
  });
});

describe("AA overlay linkage integrity", () => {
  it("every AA spell overlay has a valid overlayTarget to an existing SRD spell", () => {
    const { allCanonEntities } = require("../../src/generated/index.ts");
    const aaSpells = (allCanonEntities as CanonicalSpell[]).filter(
      (e) => e.packId === aa && e.type === "spell" && e.overlayTarget,
    );

    expect(aaSpells.length).toBeGreaterThanOrEqual(7);

    for (const aaSpell of aaSpells) {
      const target = aaSpell.overlayTarget;
      expect(target).toBeDefined();
      const srdSpell = getCanonicalEntity(target!.packId, target!.entityId);
      expect(srdSpell, `SRD base for ${aaSpell.name} (${target!.entityId}) not found`).toBeDefined();
      expect(srdSpell?.type).toBe("spell");
    }
  });

  it("every linkedAaAbilityId on an AA spell references an existing AA ability", () => {
    const { allCanonEntities } = require("../../src/generated/index.ts");
    const aaSpells = (allCanonEntities as CanonicalSpell[]).filter(
      (e) => e.packId === aa && e.type === "spell" && e.linkedAaAbilityIds?.length,
    );

    for (const aaSpell of aaSpells) {
      for (const abilityId of aaSpell.linkedAaAbilityIds!) {
        const ability = getCanonicalEntity(aa, abilityId);
        expect(ability, `linked ability ${abilityId} for ${aaSpell.name} not found`).toBeDefined();
        expect(ability?.type).toBe("aa-ability");
      }
    }
  });

  it("AA pack total entity count is correct after expansion", () => {
    const { generatedContentManifest } = require("../../src/generated/index.ts");
    expect(generatedContentManifest.packs["advanced-adventurers"]).toBeGreaterThanOrEqual(30);
  });
});

describe("AA rule entity", () => {
  it("resolves Universal Spell Learning rule", () => {
    const rule = getCanonicalEntity(aa, "aa-rule-universal-spell-learning");
    expect(rule).toBeDefined();
    expect(rule?.name).toBe("Universal Spell Learning");
    expect(rule?.type).toBe("rule");
  });
});
