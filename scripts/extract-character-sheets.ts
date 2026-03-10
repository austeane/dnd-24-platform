import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";

const SOURCE_DIR = resolve("/Users/austin/dev/dnd/dnd character sheets");
const OUTPUT_DIR = resolve("data/real-campaign-intake");
const OUTPUT_PATH = join(OUTPUT_DIR, "raw-pages.json");

type PageRole = "front" | "back" | "unknown";

interface RawCharacterSheetPage {
  sourceFile: string;
  byteSize: number;
  modifiedAt: string;
  imageWidth: number | null;
  imageHeight: number | null;
  pageRole: PageRole;
  ocrMode: "direct+tesseract" | "preprocessed+tesseract";
  ocrText: string;
  extractedHints: {
    candidateName: string | null;
    candidateClassLine: string | null;
    visibleSpellTerms: string[];
    visibleFeatureTerms: string[];
  };
  review: {
    status: "ocr-candidate";
    notes: string[];
  };
}

async function runCommand(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolvePromise({
        stdout,
        stderr,
        exitCode: exitCode ?? 1,
      });
    });
  });
}

async function getImageDimensions(path: string): Promise<{
  width: number | null;
  height: number | null;
}> {
  const result = await runCommand("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path]);

  if (result.exitCode !== 0) {
    return { width: null, height: null };
  }

  const widthMatch = result.stdout.match(/pixelWidth:\s+(\d+)/);
  const heightMatch = result.stdout.match(/pixelHeight:\s+(\d+)/);

  return {
    width: widthMatch ? Number(widthMatch[1]) : null,
    height: heightMatch ? Number(heightMatch[1]) : null,
  };
}

function guessPageRole(text: string): PageRole {
  const normalized = text.toLowerCase();

  const frontSignals = [
    "weapons & damage",
    "species traits",
    "equipment training",
    "heroic inspiration",
    "feats",
    "second wind",
  ];
  const backSignals = [
    "spellcasting",
    "spells known",
    "spell save dc",
    "spell slots",
    "notes",
    "treasure",
  ];

  const frontScore = frontSignals.filter((signal) => normalized.includes(signal)).length;
  const backScore = backSignals.filter((signal) => normalized.includes(signal)).length;

  if (frontScore > backScore && frontScore > 0) {
    return "front";
  }

  if (backScore > frontScore && backScore > 0) {
    return "back";
  }

  return "unknown";
}

function uniqueMatches(text: string, pattern: RegExp): string[] {
  return [...new Set([...text.matchAll(pattern)].map((match) => match[0].trim()))];
}

function extractHints(text: string): RawCharacterSheetPage["extractedHints"] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const candidateName =
    lines.find((line) => /^[A-Z][A-Z '-]{2,}$/.test(line) && !line.includes("CHARACTER")) ??
    null;

  const candidateClassLine =
    lines.find((line) =>
      /\b(barbarian|bard|cleric|druid|fighter|monk|paladin|ranger|rogue|sorcerer|warlock|wizard)\b/i.test(
        line,
      ),
    ) ?? null;

  return {
    candidateName,
    candidateClassLine,
    visibleSpellTerms: uniqueMatches(
      text,
      /\b(eldritch blast|mage hand|counterspell|minor illusion|animate dead|misty step|shield|bless|cure wounds)\b/gi,
    ),
    visibleFeatureTerms: uniqueMatches(
      text,
      /\b(second wind|action surge|rage|sneak attack|bardic inspiration|stone's endurance|weapon mastery|divine smite)\b/gi,
    ),
  };
}

async function ocrImage(path: string): Promise<{
  mode: RawCharacterSheetPage["ocrMode"];
  text: string;
}> {
  const tempDir = await mkdtemp(join(tmpdir(), "dnd-sheet-"));
  const directBase = join(tempDir, "direct");
  const processedPath = join(tempDir, "preprocessed.png");
  const processedBase = join(tempDir, "processed");

  try {
    const direct = await runCommand("tesseract", [path, directBase]);
    const directText =
      direct.exitCode === 0 ? (await readFile(`${directBase}.txt`, "utf8")).trim() : "";

    if (directText.length >= 500) {
      return { mode: "direct+tesseract", text: directText };
    }

    await runCommand("magick", [
      path,
      "-colorspace",
      "Gray",
      "-density",
      "300",
      "-resize",
      "200%",
      "-sharpen",
      "0x1",
      processedPath,
    ]);

    const processed = await runCommand("tesseract", [processedPath, processedBase]);
    const processedText =
      processed.exitCode === 0 ? (await readFile(`${processedBase}.txt`, "utf8")).trim() : "";

    return {
      mode: "preprocessed+tesseract",
      text: processedText.length > 0 ? processedText : directText,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const entries = await readdir(SOURCE_DIR);
  const imageFiles = entries
    .filter((entry) => entry.toLowerCase().endsWith(".jpg"))
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => join(SOURCE_DIR, entry));

  const pages: RawCharacterSheetPage[] = [];

  for (const imagePath of imageFiles) {
    const fileStat = await stat(imagePath);
    const dimensions = await getImageDimensions(imagePath);
    const ocr = await ocrImage(imagePath);
    const pageRole = guessPageRole(ocr.text);

    pages.push({
      sourceFile: basename(imagePath),
      byteSize: fileStat.size,
      modifiedAt: fileStat.mtime.toISOString(),
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
      pageRole,
      ocrMode: ocr.mode,
      ocrText: ocr.text,
      extractedHints: extractHints(ocr.text),
      review: {
        status: "ocr-candidate",
        notes: [
          "Manual verification required before this page can seed authoritative character data.",
          "Treat handwritten notes, checkbox state, and fine-grained spell details as unresolved unless explicitly verified.",
        ],
      },
    });
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify({ pages }, null, 2)}\n`, "utf8");

  process.stdout.write(`Wrote ${pages.length} page records to ${OUTPUT_PATH}\n`);
}

await main();
