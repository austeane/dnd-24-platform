import { describe, expect, it, vi } from "vitest";
import type { AttackProfile, EvaluatedResource } from "@dnd/library";
vi.mock("../progression/choice-state.ts", () => ({
  listCharacterEquipment: vi.fn(),
}));
vi.mock("./context.ts", () => ({
  getTavernCharacterContext: vi.fn(),
}));
import { buildInventoryRuntimeData } from "./inventory.ts";

describe("buildInventoryRuntimeData", () => {
  it("formats tracked resources and attack profiles for the inventory panel", () => {
    const data = buildInventoryRuntimeData({
      attackProfiles: [
        {
          name: "Quarterstaff",
          attackBonus: 5,
          damageDice: "1d8",
          damageBonus: 3,
          damageType: "bludgeoning",
          properties: ["Versatile"],
          masteryProperty: "Topple",
        } as AttackProfile,
      ],
      resources: [
        {
          name: "Wild Shape",
          currentUses: 1,
          maxUses: 2,
          resetOn: "short",
          sourceName: "Druid",
          isTracked: true,
        } as EvaluatedResource,
        {
          name: "Passive Resource",
          currentUses: 0,
          maxUses: 0,
          resetOn: "long",
          sourceName: "Ignored",
          isTracked: false,
        } as EvaluatedResource,
      ],
    });

    expect(data.attackProfiles).toEqual([
      {
        weaponName: "Quarterstaff",
        attackBonus: "+5",
        damage: "1d8+3",
        damageType: "bludgeoning",
        properties: ["Versatile"],
        masteryProperty: "Topple",
      },
    ]);
    expect(data.resources).toEqual([
      {
        resourceName: "Wild Shape",
        name: "Wild Shape",
        current: 1,
        max: 2,
        rechargeOn: "Short Rest",
        source: "Druid",
      },
    ]);
  });
});
