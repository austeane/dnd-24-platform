import type { Spell } from "../types/spell.ts";
import { parseMarkdown, splitByHeading } from "./shared.ts";

/**
 * Parse spell entries from SRD chapter 08 markdown.
 *
 * The spell format is:
 *   **Spell Name**
 *   _Level N School (Class1, Class2)_    — for leveled spells
 *   _School Cantrip (Class1, Class2)_    — for cantrips
 *
 *   **Casting Time:** ...
 *   **Range:** ...
 *   **Components:** ...
 *   **Duration:** ...
 *
 *   Description text...
 *   _**Using a Higher-Level Spell Slot.**_ ... (optional)
 */
export function parseSpells(_markdown: string): Spell[] {
  // TODO: implement spell parsing
  // 1. Parse markdown to AST
  // 2. Find spell entry boundaries (bold name headers)
  // 3. Extract metadata fields (level, school, classes, casting time, etc.)
  // 4. Extract description text
  // 5. Handle cantrip vs leveled spell format differences
  void parseMarkdown;
  void splitByHeading;
  return [];
}
