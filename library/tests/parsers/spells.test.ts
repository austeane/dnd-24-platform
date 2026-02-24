import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSpells } from "../../src/parsers/spells.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(
  resolve(__dirname, "../fixtures/spell-sample.md"),
  "utf-8",
);

describe("parseSpells", () => {
  it("returns an array", () => {
    const spells = parseSpells(fixture);
    expect(Array.isArray(spells)).toBe(true);
  });

  // These tests will pass once the parser is implemented:

  it.todo("parses Acid Arrow as a level 2 Evocation spell");
  // const spells = parseSpells(fixture);
  // const acidArrow = spells.find(s => s.name === "Acid Arrow");
  // expect(acidArrow).toBeDefined();
  // expect(acidArrow!.level).toBe(2);
  // expect(acidArrow!.school).toBe("Evocation");
  // expect(acidArrow!.classes).toEqual(["Wizard"]);
  // expect(acidArrow!.castingTime).toBe("Action");
  // expect(acidArrow!.range).toBe("90 feet");
  // expect(acidArrow!.components.verbal).toBe(true);
  // expect(acidArrow!.components.somatic).toBe(true);
  // expect(acidArrow!.components.material).toBe("powdered rhubarb leaf");
  // expect(acidArrow!.duration).toBe("Instantaneous");
  // expect(acidArrow!.concentration).toBe(false);
  // expect(acidArrow!.ritual).toBe(false);
  // expect(acidArrow!.higherLevels).toBeDefined();

  it.todo("parses Acid Splash as a cantrip (level 0)");
  // const spells = parseSpells(fixture);
  // const acidSplash = spells.find(s => s.name === "Acid Splash");
  // expect(acidSplash).toBeDefined();
  // expect(acidSplash!.level).toBe(0);
  // expect(acidSplash!.school).toBe("Evocation");
  // expect(acidSplash!.classes).toEqual(["Sorcerer", "Wizard"]);
  // expect(acidSplash!.components.verbal).toBe(true);
  // expect(acidSplash!.components.somatic).toBe(true);
  // expect(acidSplash!.components.material).toBeUndefined();
});
