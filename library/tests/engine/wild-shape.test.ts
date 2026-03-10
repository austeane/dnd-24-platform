import { describe, expect, it } from "vitest";
import {
  buildWildShapePoolDefinition,
  buildWildShapeTrait,
  computeWildShapeDuration,
  computeWildShapeMaxUses,
  createIdleWildShapeState,
  getAvailableBeastForms,
  hasWildShape,
  revertFromBeast,
  transformIntoBeast,
  BEAST_FORM_LIBRARY,
} from "../../src/engine/wild-shape.ts";
import {
  buildWildCompanionTrait,
  createEmptyFamiliarState,
  dismissFamiliar,
  handleFamiliarLongRest,
  hasWildCompanion,
  removeFamiliar,
  resummonFamiliar,
  summonSpellFamiliar,
  summonWildCompanionFamiliar,
} from "../../src/engine/familiars.ts";
import type { SourceWithEffects } from "../../src/types/effect.ts";

// --- Tali fixtures ---

/**
 * Tali — Level 4 Druid (hybrid progression, per verified-characters.json).
 * Wild Shape + Wild Companion sources.
 */
const taliSources: SourceWithEffects[] = [
  {
    source: {
      id: "class-level-druid",
      kind: "class-level",
      name: "Druid 4",
      rank: 4,
    },
    effects: [],
  },
  {
    source: {
      id: "wild-shape",
      kind: "class-feature",
      name: "Wild Shape",
      entityId: "class-feature:wild-shape",
      packId: "srd-5e-2024",
    },
    effects: [
      {
        type: "grant-resource",
        resource: { name: "Wild Shape", maxUses: 2, resetOn: "short" },
      },
      {
        type: "grant-action",
        action: {
          name: "Wild Shape",
          timing: "bonus-action",
          description:
            "Shape-shift into a known beast form for up to half your druid level in hours.",
        },
      },
    ],
  },
  {
    source: {
      id: "wild-companion",
      kind: "class-feature",
      name: "Wild Companion",
      entityId: "class-feature:wild-companion",
      packId: "srd-5e-2024",
    },
    effects: [
      {
        type: "grant-action",
        action: {
          name: "Wild Companion",
          timing: "action",
          description:
            "Cast Find Familiar without material components by spending a spell slot or a use of Wild Shape.",
        },
      },
    ],
  },
];

const TALI_DRUID_LEVEL = 4;

// --- Wild Shape resource pool ---

describe("Wild Shape resource pool", () => {
  it("detects Wild Shape from sources", () => {
    expect(hasWildShape(taliSources)).toBe(true);
  });

  it("does not detect Wild Shape on non-druid sources", () => {
    const fighterSources: SourceWithEffects[] = [
      {
        source: { id: "fighter-2", kind: "class-level", name: "Fighter 2", rank: 2 },
        effects: [],
      },
    ];
    expect(hasWildShape(fighterSources)).toBe(false);
  });

  it("computes Wild Shape max uses as 2", () => {
    expect(computeWildShapeMaxUses()).toBe(2);
  });

  it("builds Wild Shape pool definition for Tali", () => {
    const pool = buildWildShapePoolDefinition(taliSources);
    expect(pool).not.toBeNull();
    expect(pool!.resourceName).toBe("Wild Shape");
    expect(pool!.maxUses).toBe(2);
    expect(pool!.resetOn).toBe("short");
    expect(pool!.sourceName).toBe("Wild Shape");
  });

  it("returns null pool for non-druid", () => {
    const pool = buildWildShapePoolDefinition([
      {
        source: { id: "fighter-2", kind: "class-level", name: "Fighter 2", rank: 2 },
        effects: [],
      },
    ]);
    expect(pool).toBeNull();
  });
});

// --- Wild Shape duration ---

describe("Wild Shape duration", () => {
  it("level 2 druid = 1 hour", () => {
    expect(computeWildShapeDuration(2)).toBe(1);
  });

  it("level 4 druid = 2 hours", () => {
    expect(computeWildShapeDuration(TALI_DRUID_LEVEL)).toBe(2);
  });

  it("level 10 druid = 5 hours", () => {
    expect(computeWildShapeDuration(10)).toBe(5);
  });

  it("level 1 druid (edge case) = minimum 1 hour", () => {
    expect(computeWildShapeDuration(1)).toBe(1);
  });
});

// --- Beast form library ---

describe("Beast form library", () => {
  it("has at least 3 forms in the library", () => {
    expect(BEAST_FORM_LIBRARY.length).toBeGreaterThanOrEqual(3);
  });

  it("level 2 druid gets CR 1/4 forms without fly speed", () => {
    const forms = getAvailableBeastForms(2);
    expect(forms.length).toBeGreaterThan(0);
    for (const form of forms) {
      expect(form.flySpeed).toBeUndefined();
    }
  });

  it("level 4 druid (Tali) gets CR 1/2 and below forms", () => {
    const forms = getAvailableBeastForms(TALI_DRUID_LEVEL);
    expect(forms.length).toBeGreaterThan(0);
    for (const form of forms) {
      expect(form.flySpeed).toBeUndefined();
    }
  });

  it("wolf form has expected stats", () => {
    const wolf = BEAST_FORM_LIBRARY.find((f) => f.name === "Wolf");
    expect(wolf).toBeDefined();
    expect(wolf!.cr).toBe("1/4");
    expect(wolf!.armorClass).toBe(13);
    expect(wolf!.hitPoints).toBe(11);
    expect(wolf!.speed).toBe(40);
  });
});

// --- Transform state ---

describe("Wild Shape transform state", () => {
  it("creates idle state", () => {
    const idle = createIdleWildShapeState();
    expect(idle.isTransformed).toBe(false);
    expect(idle.beastForm).toBeNull();
    expect(idle.tempHitPoints).toBe(0);
  });

  it("transforms Tali into wolf", () => {
    const wolf = BEAST_FORM_LIBRARY.find((f) => f.name === "Wolf")!;
    const state = transformIntoBeast(wolf, TALI_DRUID_LEVEL, "2026-01-01T12:00:00Z");

    expect(state.isTransformed).toBe(true);
    expect(state.beastForm!.name).toBe("Wolf");
    expect(state.tempHitPoints).toBe(TALI_DRUID_LEVEL);
    expect(state.durationHours).toBe(2);
    expect(state.transformedAt).toBe("2026-01-01T12:00:00Z");
  });

  it("reverts from beast form with no damage", () => {
    const wolf = BEAST_FORM_LIBRARY.find((f) => f.name === "Wolf")!;
    const transformed = transformIntoBeast(wolf, TALI_DRUID_LEVEL);

    const { newState, excessDamage } = revertFromBeast(transformed);
    expect(newState.isTransformed).toBe(false);
    expect(newState.beastForm).toBeNull();
    expect(excessDamage).toBe(0);
  });

  it("reverts from beast form with excess damage carry-over", () => {
    const wolf = BEAST_FORM_LIBRARY.find((f) => f.name === "Wolf")!;
    const transformed = transformIntoBeast(wolf, TALI_DRUID_LEVEL);
    // Tali has 4 temp HP in beast form (druid level 4). Take 7 damage.
    const { newState, excessDamage } = revertFromBeast(transformed, 7);
    expect(newState.isTransformed).toBe(false);
    expect(excessDamage).toBe(3); // 7 - 4 = 3 excess
  });

  it("excess damage is 0 when damage <= temp HP", () => {
    const wolf = BEAST_FORM_LIBRARY.find((f) => f.name === "Wolf")!;
    const transformed = transformIntoBeast(wolf, TALI_DRUID_LEVEL);
    const { excessDamage } = revertFromBeast(transformed, 2);
    expect(excessDamage).toBe(0);
  });
});

// --- Wild Shape trait ---

describe("Wild Shape trait builder", () => {
  it("builds trait for Tali", () => {
    const trait = buildWildShapeTrait(taliSources, TALI_DRUID_LEVEL);
    expect(trait).not.toBeNull();
    expect(trait!.name).toBe("Wild Shape");
    expect(trait!.description).toContain("2 hour(s)");
    expect(trait!.description).toContain("2 uses per short rest");
    expect(trait!.tags).toContain("wild-shape");
  });

  it("returns null for non-druid", () => {
    const trait = buildWildShapeTrait(
      [{ source: { id: "f", kind: "class-level", name: "Fighter 2", rank: 2 }, effects: [] }],
      2,
    );
    expect(trait).toBeNull();
  });
});

// --- Wild Companion ---

describe("Wild Companion", () => {
  it("detects Wild Companion from sources", () => {
    expect(hasWildCompanion(taliSources)).toBe(true);
  });

  it("builds Wild Companion trait", () => {
    const trait = buildWildCompanionTrait(taliSources);
    expect(trait).not.toBeNull();
    expect(trait!.name).toBe("Wild Companion");
    expect(trait!.description).toContain("Find Familiar");
    expect(trait!.description).toContain("Long Rest");
  });
});

// --- Familiar state lifecycle ---

describe("Familiar state lifecycle", () => {
  it("starts with no familiar", () => {
    const state = createEmptyFamiliarState();
    expect(state.status).toBe("none");
    expect(state.form).toBeNull();
    expect(state.summonedViaWildCompanion).toBe(false);
  });

  it("summons Wild Companion familiar (owl)", () => {
    const state = summonWildCompanionFamiliar("owl", "2026-01-01T12:00:00Z");
    expect(state.status).toBe("active");
    expect(state.form).toBe("owl");
    expect(state.summonedViaWildCompanion).toBe(true);
    expect(state.summonedAt).toBe("2026-01-01T12:00:00Z");
  });

  it("summons spell familiar (hawk)", () => {
    const state = summonSpellFamiliar("hawk", "2026-01-01T12:00:00Z");
    expect(state.status).toBe("active");
    expect(state.form).toBe("hawk");
    expect(state.summonedViaWildCompanion).toBe(false);
  });

  it("dismisses an active familiar", () => {
    const active = summonWildCompanionFamiliar("owl");
    const dismissed = dismissFamiliar(active);
    expect(dismissed.status).toBe("dismissed");
    expect(dismissed.form).toBe("owl");
  });

  it("dismiss is no-op for non-active familiar", () => {
    const empty = createEmptyFamiliarState();
    const result = dismissFamiliar(empty);
    expect(result.status).toBe("none");
  });

  it("re-summons a dismissed familiar", () => {
    const active = summonWildCompanionFamiliar("owl");
    const dismissed = dismissFamiliar(active);
    const resummoned = resummonFamiliar(dismissed);
    expect(resummoned.status).toBe("active");
    expect(resummoned.form).toBe("owl");
  });

  it("resummon is no-op for non-dismissed familiar", () => {
    const active = summonWildCompanionFamiliar("owl");
    const result = resummonFamiliar(active);
    expect(result.status).toBe("active");
  });

  it("removes familiar entirely", () => {
    const state = removeFamiliar();
    expect(state.status).toBe("none");
    expect(state.form).toBeNull();
  });
});

// --- Familiar long rest handling ---

describe("Familiar long rest", () => {
  it("Wild Companion familiar disappears on long rest", () => {
    const wcFamiliar = summonWildCompanionFamiliar("owl");
    const afterRest = handleFamiliarLongRest(wcFamiliar);
    expect(afterRest.status).toBe("none");
    expect(afterRest.form).toBeNull();
  });

  it("Wild Companion dismissed familiar also disappears on long rest", () => {
    const wcFamiliar = dismissFamiliar(summonWildCompanionFamiliar("owl"));
    const afterRest = handleFamiliarLongRest(wcFamiliar);
    expect(afterRest.status).toBe("none");
  });

  it("spell-cast familiar persists through long rest", () => {
    const spellFamiliar = summonSpellFamiliar("hawk");
    const afterRest = handleFamiliarLongRest(spellFamiliar);
    expect(afterRest.status).toBe("active");
    expect(afterRest.form).toBe("hawk");
  });

  it("no familiar is unchanged by long rest", () => {
    const empty = createEmptyFamiliarState();
    const afterRest = handleFamiliarLongRest(empty);
    expect(afterRest.status).toBe("none");
  });
});

// --- Live roster integration: Tali Druid 4 Wild Shape flow ---

describe("Tali (Druid 4) Wild Shape live-roster flow", () => {
  it("proves full Wild Shape use → transform → revert loop", () => {
    // 1. Tali has Wild Shape
    expect(hasWildShape(taliSources)).toBe(true);

    // 2. Pool definition
    const pool = buildWildShapePoolDefinition(taliSources);
    expect(pool!.maxUses).toBe(2);
    expect(pool!.resetOn).toBe("short");

    // 3. Transform into wolf
    const wolf = BEAST_FORM_LIBRARY.find((f) => f.name === "Wolf")!;
    const transformed = transformIntoBeast(wolf, TALI_DRUID_LEVEL, "2026-01-01T12:00:00Z");
    expect(transformed.isTransformed).toBe(true);
    expect(transformed.tempHitPoints).toBe(4);
    expect(transformed.durationHours).toBe(2);

    // 4. Take damage and revert
    const { newState, excessDamage } = revertFromBeast(transformed, 6);
    expect(newState.isTransformed).toBe(false);
    expect(excessDamage).toBe(2); // 6 - 4 temp HP = 2 excess
  });
});

// --- Live roster integration: Tali Druid 4 Wild Companion flow ---

describe("Tali (Druid 4) Wild Companion live-roster flow", () => {
  it("proves Wild Companion summon → dismiss → long rest expiry loop", () => {
    // 1. Tali has Wild Companion
    expect(hasWildCompanion(taliSources)).toBe(true);

    // 2. Summon familiar via Wild Companion (costs 1 Wild Shape use)
    const familiar = summonWildCompanionFamiliar("owl", "2026-01-01T14:00:00Z");
    expect(familiar.status).toBe("active");
    expect(familiar.form).toBe("owl");
    expect(familiar.summonedViaWildCompanion).toBe(true);

    // 3. Dismiss familiar (pocket dimension)
    const dismissed = dismissFamiliar(familiar);
    expect(dismissed.status).toBe("dismissed");

    // 4. Re-summon
    const resummoned = resummonFamiliar(dismissed);
    expect(resummoned.status).toBe("active");

    // 5. Long rest: Wild Companion familiar disappears
    const afterRest = handleFamiliarLongRest(resummoned);
    expect(afterRest.status).toBe("none");
    expect(afterRest.form).toBeNull();
  });
});
