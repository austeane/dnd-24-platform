import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSpells, type Spell } from "../library/src/index.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const syncedChapterPath = path.join(rootDir, "content", "srd-markdown", "chapters", "08-spells.md");
const fallbackChapterPath = path.resolve(rootDir, "../dnd-24-resources/chapters/08-spells.md");
const outputDir = path.join(rootDir, "content", "canon", "packs", "srd-5e-2024", "spells");

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSummary(spell: Spell): string {
  const sentence = spell.description
    .replace(/\s+/g, " ")
    .split(".")
    .map((part) => part.trim())
    .find((part) => part.length > 0);

  return sentence ? `${sentence}.` : `${spell.name} spell.`;
}

function toCanonicalMarkdown(spell: Spell): string {
  const slug = slugify(spell.name);
  const frontmatter = {
    type: "spell",
    id: `spell-${slug}`,
    slug,
    name: spell.name,
    packId: "srd-5e-2024",
    sourceEdition: "srd-2024",
    sourceReference: {
      sourceTitle: "System Reference Document 5.2.1",
      locator: `chapter-08:${spell.name}`,
    },
    adaptationMode: "verbatim",
    judgement: null,
    reviewStatus: "verified",
    summary: buildSummary(spell),
    tags: [
      spell.level === 0 ? "cantrip" : `level-${spell.level}`,
      spell.school.toLowerCase(),
      ...spell.classes.map((className) => className.toLowerCase()),
    ],
    level: spell.level,
    school: spell.school,
    classes: spell.classes,
    availability: "class-list",
    castingTime: spell.castingTime,
    ritual: spell.ritual,
    range: spell.range,
    components: spell.components,
    duration: spell.duration,
    concentration: spell.concentration,
    ...(spell.higherLevels
      ? {
          higherLevelsLabel: "Using a Higher-Level Spell Slot",
          higherLevelsMd: spell.higherLevels,
        }
      : {}),
  };

  return `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n${spell.description.trim()}\n`;
}

async function loadChapter(): Promise<string> {
  try {
    return await readFile(syncedChapterPath, "utf8");
  } catch {
    return readFile(fallbackChapterPath, "utf8");
  }
}

async function main(): Promise<void> {
  const requestedNames = process.argv.slice(2);
  if (requestedNames.length === 0) {
    throw new Error("Pass one or more spell names to import.");
  }

  const chapter = await loadChapter();
  const parsedSpells = parseSpells(chapter);
  const byName = new Map(parsedSpells.map((spell) => [spell.name.toLowerCase(), spell]));

  await mkdir(outputDir, { recursive: true });

  for (const requestedName of requestedNames) {
    const spell = byName.get(requestedName.trim().toLowerCase());
    if (!spell) {
      throw new Error(`Could not find spell "${requestedName}" in SRD chapter 08.`);
    }

    const slug = slugify(spell.name);
    const filePath = path.join(outputDir, `${slug}.md`);
    await writeFile(filePath, toCanonicalMarkdown(spell), "utf8");
    process.stdout.write(`Wrote ${filePath}\n`);
  }
}

await main();
