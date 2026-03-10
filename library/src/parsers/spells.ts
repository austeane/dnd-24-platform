import type { Spell } from "../types/spell.ts";
import { parseMarkdown, splitByHeading } from "./shared.ts";

interface ParsedSpellSection {
  name: string;
  subtitle: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  body: string;
}

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function isSpellHeader(lines: string[], index: number): boolean {
  const current = lines[index]?.trim();
  if (!current?.startsWith("**") || !current.endsWith("**")) {
    return false;
  }

  let nextIndex = index + 1;
  while (nextIndex < lines.length && lines[nextIndex]!.trim().length === 0) {
    nextIndex += 1;
  }

  const next = lines[nextIndex]?.trim() ?? "";
  return next.startsWith("_") && (next.includes("Cantrip") || next.includes("Level "));
}

function splitSpellSections(markdown: string): ParsedSpellSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: ParsedSpellSection[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!isSpellHeader(lines, index)) {
      continue;
    }

    const name = normalizeLine(lines[index]!.replace(/^\*\*|\*\*$/g, ""));
    let cursor = index + 1;

    while (cursor < lines.length && lines[cursor]!.trim().length === 0) {
      cursor += 1;
    }

    const subtitleLines: string[] = [];
    while (cursor < lines.length) {
      const line = lines[cursor]!.trim();
      if (!line.startsWith("_")) {
        break;
      }
      subtitleLines.push(normalizeLine(line.replace(/^_+|_+$/g, "")));
      cursor += 1;
    }

    const metadata = new Map<string, string>();
    let currentMetadataKey: string | null = null;
    while (cursor < lines.length) {
      const line = lines[cursor]!.trim();

      if (line.length === 0) {
        cursor += 1;
        continue;
      }
      if (
        /^## Page \d+$/i.test(line) ||
        line.startsWith("<!--") ||
        /^\*\*\d+\*\* System Reference Document/.test(line)
      ) {
        cursor += 1;
        continue;
      }

      const metadataMatch = line.match(
        /^\*\*(Casting Time|Range|Components?|Duration):\*\*\s*(.*)$/,
      );
      if (metadataMatch) {
        currentMetadataKey = metadataMatch[1] === "Component"
          ? "Components"
          : metadataMatch[1]!;
        metadata.set(currentMetadataKey, normalizeLine(metadataMatch[2] ?? ""));
        cursor += 1;
        continue;
      }

      if (currentMetadataKey && metadata.size < 4) {
        metadata.set(
          currentMetadataKey,
          normalizeLine(`${metadata.get(currentMetadataKey) ?? ""} ${line}`),
        );
        cursor += 1;
        continue;
      }

      break;
    }

    if (
      !metadata.has("Casting Time") ||
      !metadata.has("Range") ||
      !metadata.has("Components") ||
      !metadata.has("Duration")
    ) {
      continue;
    }

    const bodyLines: string[] = [];
    while (cursor < lines.length && !isSpellHeader(lines, cursor)) {
      bodyLines.push(lines[cursor]!);
      cursor += 1;
    }

    sections.push({
      name,
      subtitle: subtitleLines.join(" "),
      castingTime: metadata.get("Casting Time")!,
      range: metadata.get("Range")!,
      components: metadata.get("Components")!,
      duration: metadata.get("Duration")!,
      body: bodyLines.join("\n"),
    });

    index = cursor - 1;
  }

  return sections;
}

function parseSubtitle(subtitle: string): {
  level: number;
  school: Spell["school"];
  classes: string[];
} | null {
  const cantripMatch = subtitle.match(/^([A-Za-z]+) Cantrip \((.+)\)$/);
  if (cantripMatch) {
    return {
      level: 0,
      school: cantripMatch[1] as Spell["school"],
      classes: cantripMatch[2]!.split(",").map((value) => normalizeLine(value)),
    };
  }

  const leveledMatch = subtitle.match(/^Level (\d+) ([A-Za-z]+) \((.+)\)$/);
  if (leveledMatch) {
    return {
      level: Number(leveledMatch[1]),
      school: leveledMatch[2] as Spell["school"],
      classes: leveledMatch[3]!.split(",").map((value) => normalizeLine(value)),
    };
  }

  return null;
}

function normalizeBody(body: string): string {
  const cleaned = body
    .replace(/^## Page \d+\s*$/gm, "")
    .replace(/^<!--[\s\S]*?-->\s*$/gm, "")
    .replace(/^\*\*\d+\*\* System Reference Document 5\.2\.1\s*$/gm, "")
    .trim();

  return cleaned
    .split(/\n\s*\n/g)
    .map((paragraph) =>
      paragraph
        .split(/\r?\n/)
        .map((line) => normalizeLine(line))
        .filter((line) => line.length > 0)
        .join(" ")
    )
    .filter((paragraph) => paragraph.length > 0)
    .join("\n\n");
}

function splitHigherLevels(
  level: number,
  body: string,
): { description: string; higherLevels?: string } {
  const labelledPatterns = [
    "_**Using a Higher-Level Spell Slot.**_",
    "_**At Higher Levels.**_",
    "_**Cantrip Upgrade.**_",
  ] as const;

  for (const pattern of labelledPatterns) {
    const index = body.indexOf(pattern);
    if (index >= 0) {
      const higherLevels = body.slice(index + pattern.length).trim();
      const description = body.slice(0, index).trim();
      if (description.length > 0 && higherLevels.length > 0) {
        return {
          description,
          higherLevels,
        };
      }
    }
  }

  const labelledMatch = body.match(
    /^([\s\S]*?)\s+\*\*(Using a Higher-Level Spell Slot|At Higher Levels|Cantrip Upgrade)\.\*\*\s*([\s\S]+)$/i,
  );
  if (labelledMatch) {
      return {
        description: labelledMatch[1]!.trim(),
        higherLevels: labelledMatch[3]!.trim(),
      };
    }

  if (level === 0) {
    const cantripMatch = body.match(/^([\s\S]*?)\s+(At higher levels,[\s\S]+)$/i);
    if (cantripMatch) {
      return {
        description: cantripMatch[1]!.trim(),
        higherLevels: cantripMatch[2]!.trim(),
      };
    }
  }

  return {
    description: body,
    higherLevels: undefined,
  };
}

function parseComponents(componentsText: string): Spell["components"] {
  const materialMatch = componentsText.match(/\bM\s*\((.+)\)/);
  return {
    verbal: /\bV\b/.test(componentsText),
    somatic: /\bS\b/.test(componentsText),
    material: materialMatch?.[1]?.trim(),
  };
}

/**
 * Parse spell entries from SRD chapter 08 markdown.
 */
export function parseSpells(markdown: string): Spell[] {
  void parseMarkdown;
  void splitByHeading;

  return splitSpellSections(markdown).flatMap((section) => {
    const parsedSubtitle = parseSubtitle(section.subtitle);
    if (!parsedSubtitle) {
      return [];
    }

    const normalizedBody = normalizeBody(section.body);
    const { description, higherLevels } = splitHigherLevels(
      parsedSubtitle.level,
      normalizedBody,
    );
    const ritual = / or Ritual$/i.test(section.castingTime);
    const concentration = /^Concentration,\s*/i.test(section.duration);

    return [{
      name: section.name,
      level: parsedSubtitle.level,
      school: parsedSubtitle.school,
      classes: parsedSubtitle.classes,
      castingTime: normalizeLine(section.castingTime.replace(/\s+or Ritual$/i, "")),
      ritual,
      range: normalizeLine(section.range),
      components: parseComponents(section.components),
      duration: normalizeLine(section.duration.replace(/^Concentration,\s*/i, "")),
      concentration,
      description,
      higherLevels,
    } satisfies Spell];
  });
}
