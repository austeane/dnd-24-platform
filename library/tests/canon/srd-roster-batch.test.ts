import { describe, expect, it } from "vitest";
import {
  getCanonicalEntity,
  getCanonicalSpellByName,
} from "../../src/index.ts";
import type { PackId } from "../../src/canon/types.ts";

const srd: PackId = "srd-5e-2024";

/**
 * These tests verify that every roster-critical SRD entity exists in the
 * compiled canonical catalog and can be looked up by entity ID.
 *
 * Roster: Ronan (Fighter/Goliath), Tali (Druid), Oriana (Warlock/Drow),
 *         Vivennah (Bard/Wood Elf), Nara (Sorcerer).
 */

describe("roster-critical classes", () => {
  const expectedClasses = [
    { entityId: "class:fighter", name: "Fighter" },
    { entityId: "class:druid", name: "Druid" },
    { entityId: "class:warlock", name: "Warlock" },
    { entityId: "class:bard", name: "Bard" },
    { entityId: "class:sorcerer", name: "Sorcerer" },
  ];

  for (const { entityId, name } of expectedClasses) {
    it(`resolves ${name} class`, () => {
      const entity = getCanonicalEntity(srd, entityId);
      expect(entity).toBeDefined();
      expect(entity?.name).toBe(name);
      expect(entity?.type).toBe("class");
    });
  }
});

describe("roster-critical species", () => {
  const expectedSpecies = [
    { entityId: "species:goliath", name: "Goliath" },
    { entityId: "species:drow", name: "Drow" },
    { entityId: "species:wood-elf", name: "Wood Elf" },
  ];

  for (const { entityId, name } of expectedSpecies) {
    it(`resolves ${name} species`, () => {
      const entity = getCanonicalEntity(srd, entityId);
      expect(entity).toBeDefined();
      expect(entity?.name).toBe(name);
      expect(entity?.type).toBe("species");
    });
  }
});

describe("roster-critical class features", () => {
  const expectedFeatures = [
    // Ronan (Fighter)
    { entityId: "class-feature:second-wind", name: "Second Wind" },
    { entityId: "class-feature:weapon-mastery", name: "Weapon Mastery" },
    // Tali (Druid)
    { entityId: "class-feature:primal-order-warden", name: "Primal Order: Warden" },
    { entityId: "class-feature:wild-shape", name: "Wild Shape" },
    { entityId: "class-feature:wild-companion", name: "Wild Companion" },
    { entityId: "class-feature:druidic", name: "Druidic" },
    // Oriana (Warlock)
    { entityId: "class-feature:pact-of-the-blade", name: "Pact of the Blade" },
    { entityId: "class-feature:magical-cunning", name: "Magical Cunning" },
    // Vivennah (Bard)
    { entityId: "class-feature:bardic-inspiration", name: "Bardic Inspiration" },
    // Nara (Sorcerer)
    { entityId: "class-feature:font-of-magic", name: "Font of Magic" },
  ];

  for (const { entityId, name } of expectedFeatures) {
    it(`resolves ${name}`, () => {
      const entity = getCanonicalEntity(srd, entityId);
      expect(entity).toBeDefined();
      expect(entity?.name).toBe(name);
      expect(entity?.type).toBe("class-feature");
    });
  }
});

describe("roster-critical training features", () => {
  const expectedTraining = [
    { entityId: "class-feature-fighter-training", name: "Fighter Training" },
    { entityId: "class-feature-druid-training", name: "Druid Training" },
    { entityId: "class-feature-warlock-training", name: "Warlock Training" },
    { entityId: "class-feature-bard-training", name: "Bard Training" },
    { entityId: "class-feature-sorcerer-training", name: "Sorcerer Training" },
  ];

  for (const { entityId, name } of expectedTraining) {
    it(`resolves ${name}`, () => {
      const entity = getCanonicalEntity(srd, entityId);
      expect(entity).toBeDefined();
      expect(entity?.name).toBe(name);
      expect(entity?.type).toBe("class-feature");
    });
  }
});

describe("roster-critical spellcasting progression", () => {
  const expectedSlotSources = [
    { entityId: "class-feature-bard-spellcasting-2", name: "Bard Spellcasting (Level 2)" },
    { entityId: "class-feature-druidic-spellcasting-2", name: "Druidic Spellcasting (Level 2)" },
    { entityId: "class-feature-pact-magic-2", name: "Pact Magic (Level 2)" },
    { entityId: "class-feature-sorcerous-spellcasting-2", name: "Sorcerous Spellcasting (Level 2)" },
  ];

  for (const { entityId, name } of expectedSlotSources) {
    it(`resolves ${name}`, () => {
      const entity = getCanonicalEntity(srd, entityId);
      expect(entity).toBeDefined();
      expect(entity?.name).toBe(name);
      expect(entity?.type).toBe("class-feature");
    });
  }
});

describe("roster-critical metamagic", () => {
  it("resolves Metamagic class feature", () => {
    const entity = getCanonicalEntity(srd, "class-feature-metamagic");
    expect(entity).toBeDefined();
    expect(entity?.name).toBe("Metamagic");
    expect(entity?.type).toBe("class-feature");
  });
});

describe("roster-critical feats", () => {
  const expectedFeats = [
    { entityId: "feat:savage-attacker", name: "Savage Attacker" },
    { entityId: "feat:skilled", name: "Skilled" },
    { entityId: "feat:magic-initiate", name: "Magic Initiate" },
    { entityId: "feat:musician", name: "Musician" },
  ];

  for (const { entityId, name } of expectedFeats) {
    it(`resolves ${name}`, () => {
      const entity = getCanonicalEntity(srd, entityId);
      expect(entity).toBeDefined();
      expect(entity?.name).toBe(name);
      expect(entity?.type).toBe("feat");
    });
  }
});

describe("roster-critical spells by entity ID", () => {
  const expectedSpells = [
    // Tali's spells
    { id: "spell-shillelagh", name: "Shillelagh" },
    { id: "spell-druidcraft", name: "Druidcraft" },
    { id: "spell-guidance", name: "Guidance" },
    { id: "spell-message", name: "Message" },
    { id: "spell-hex", name: "Hex" },
    { id: "spell-entangle", name: "Entangle" },
    { id: "spell-cure-wounds", name: "Cure Wounds" },
    { id: "spell-faerie-fire", name: "Faerie Fire" },
    { id: "spell-detect-magic", name: "Detect Magic" },
    { id: "spell-jump", name: "Jump" },
    { id: "spell-disguise-self", name: "Disguise Self" },
    // Oriana's spells
    { id: "spell-dancing-lights", name: "Dancing Lights" },
    { id: "spell-eldritch-blast", name: "Eldritch Blast" },
    { id: "spell-toll-the-dead", name: "Toll the Dead" },
    { id: "spell-hellish-rebuke", name: "Hellish Rebuke" },
    // Vivennah's spells
    { id: "spell-true-strike", name: "True Strike" },
    { id: "spell-vicious-mockery", name: "Vicious Mockery" },
    { id: "spell-speak-with-animals", name: "Speak with Animals" },
    { id: "spell-hideous-laughter", name: "Hideous Laughter" },
    { id: "spell-thunderwave", name: "Thunderwave" },
    // Wild Companion dependency
    { id: "spell-find-familiar", name: "Find Familiar" },
  ];

  for (const { id, name } of expectedSpells) {
    it(`resolves ${name} by ID`, () => {
      const entity = getCanonicalEntity(srd, id);
      expect(entity).toBeDefined();
      expect(entity?.name).toBe(name);
      expect(entity?.type).toBe("spell");
    });
  }
});

describe("roster spell name lookups", () => {
  it("resolves Tasha's Hideous Laughter via alias", () => {
    const spell = getCanonicalSpellByName("Tasha's Hideous Laughter");
    expect(spell).toBeDefined();
    expect(spell?.id).toBe("spell-hideous-laughter");
    expect(spell?.name).toBe("Hideous Laughter");
  });

  it("resolves Toll the Dead by display name", () => {
    const spell = getCanonicalSpellByName("Toll the Dead");
    expect(spell).toBeDefined();
    expect(spell?.id).toBe("spell-toll-the-dead");
  });

  it("resolves Eldritch Blast by display name", () => {
    const spell = getCanonicalSpellByName("Eldritch Blast");
    expect(spell).toBeDefined();
    // With both packs enabled, the AA overlay takes priority over the SRD base
    expect(spell?.name).toBe("Eldritch Blast");
  });

  it("resolves Cure Wounds by display name", () => {
    const spell = getCanonicalSpellByName("Cure Wounds");
    expect(spell).toBeDefined();
    expect(spell?.id).toBe("spell-cure-wounds");
  });
});

describe("roster species effects are modeled", () => {
  it("Goliath has Stone's Endurance grant-action", () => {
    const entity = getCanonicalEntity(srd, "species:goliath");
    expect(entity?.type).toBe("species");
    if (entity?.type !== "species") return;
    const actionEffects = entity.effects.filter((e) => e.type === "grant-action");
    expect(actionEffects.length).toBeGreaterThanOrEqual(1);
  });

  it("Drow has 120-foot darkvision", () => {
    const entity = getCanonicalEntity(srd, "species:drow");
    expect(entity?.type).toBe("species");
    if (entity?.type !== "species") return;
    const senseEffects = entity.effects.filter((e) => e.type === "grant-sense");
    expect(senseEffects).toContainEqual({
      type: "grant-sense",
      sense: { sense: "Darkvision", range: 120 },
    });
  });

  it("Wood Elf has speed bonus", () => {
    const entity = getCanonicalEntity(srd, "species:wood-elf");
    expect(entity?.type).toBe("species");
    if (entity?.type !== "species") return;
    const speedEffects = entity.effects.filter((e) => e.type === "speed-bonus");
    expect(speedEffects).toContainEqual({
      type: "speed-bonus",
      value: 5,
      movementType: "walk",
    });
  });
});

describe("roster class features have effects", () => {
  it("Second Wind has grant-action and grant-resource", () => {
    const entity = getCanonicalEntity(srd, "class-feature:second-wind");
    expect(entity?.type).toBe("class-feature");
    if (entity?.type !== "class-feature") return;
    const effectTypes = entity.effects.map((e) => e.type);
    expect(effectTypes).toContain("grant-action");
    expect(effectTypes).toContain("grant-resource");
  });

  it("Bardic Inspiration has grant-action and grant-scaling-resource", () => {
    const entity = getCanonicalEntity(srd, "class-feature:bardic-inspiration");
    expect(entity?.type).toBe("class-feature");
    if (entity?.type !== "class-feature") return;
    const effectTypes = entity.effects.map((e) => e.type);
    expect(effectTypes).toContain("grant-action");
    expect(effectTypes).toContain("grant-scaling-resource");
  });

  it("Wild Shape has grant-action and grant-resource", () => {
    const entity = getCanonicalEntity(srd, "class-feature:wild-shape");
    expect(entity?.type).toBe("class-feature");
    if (entity?.type !== "class-feature") return;
    const effectTypes = entity.effects.map((e) => e.type);
    expect(effectTypes).toContain("grant-action");
    expect(effectTypes).toContain("grant-resource");
  });

  it("Font of Magic has grant-resource", () => {
    const entity = getCanonicalEntity(srd, "class-feature:font-of-magic");
    expect(entity?.type).toBe("class-feature");
    if (entity?.type !== "class-feature") return;
    const effectTypes = entity.effects.map((e) => e.type);
    expect(effectTypes).toContain("grant-resource");
  });

  it("Pact of the Blade has grant-action", () => {
    const entity = getCanonicalEntity(srd, "class-feature:pact-of-the-blade");
    expect(entity?.type).toBe("class-feature");
    if (entity?.type !== "class-feature") return;
    const effectTypes = entity.effects.map((e) => e.type);
    expect(effectTypes).toContain("grant-action");
  });
});

describe("roster caster classes have spellcastingAbility", () => {
  const casterClasses = [
    { entityId: "class:bard", ability: "charisma" },
    { entityId: "class:druid", ability: "wisdom" },
    { entityId: "class:warlock", ability: "charisma" },
    { entityId: "class:sorcerer", ability: "charisma" },
  ];

  for (const { entityId, ability } of casterClasses) {
    it(`${entityId} has spellcastingAbility=${ability}`, () => {
      const entity = getCanonicalEntity(srd, entityId);
      expect(entity?.type).toBe("class");
      if (entity?.type !== "class") return;
      expect(entity.spellcastingAbility).toBe(ability);
    });
  }
});
