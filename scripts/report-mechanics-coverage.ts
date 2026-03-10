import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  srd2024MechanicsCoverage,
} from "../data/mechanics-coverage/srd-5e-2024.ts";
import type {
  CoverageStatus,
  MechanicsCoverageEntry,
} from "../data/mechanics-coverage/types.ts";

const statusOrder: CoverageStatus[] = ["full", "partial", "none"];
const statusLabels: Record<CoverageStatus, string> = {
  full: "Full",
  partial: "Partial",
  none: "None",
};

function countByStatus(entries: MechanicsCoverageEntry[]): Record<CoverageStatus, number> {
  return entries.reduce(
    (counts, entry) => {
      counts[entry.status] += 1;
      return counts;
    },
    { full: 0, partial: 0, none: 0 } satisfies Record<CoverageStatus, number>,
  );
}

function formatStatus(status: CoverageStatus): string {
  return statusLabels[status];
}

function formatRefs(refs: string[] | undefined): string {
  if (!refs || refs.length === 0) {
    return "";
  }

  return refs.map((ref) => `\`${ref}\``).join(", ");
}

function buildMarkdown(entries: MechanicsCoverageEntry[]): string {
  const totalCounts = countByStatus(entries);
  const groupedEntries = new Map<string, MechanicsCoverageEntry[]>();

  for (const entry of entries) {
    const areaEntries = groupedEntries.get(entry.area) ?? [];
    areaEntries.push(entry);
    groupedEntries.set(entry.area, areaEntries);
  }

  const lines: string[] = [
    "# SRD Mechanics Coverage",
    "",
    "This tracker uses subsystem / feature granularity rather than sentence-by-sentence SRD parsing.",
    "",
    "Status meanings:",
    "",
    "- `Full`: usable without outside references for the tracked mechanic.",
    "- `Partial`: some canon/runtime/data support exists, but the mechanic still leaks to notes, manual choice state, or missing execution logic.",
    "- `None`: not implemented beyond maybe a canon content placeholder.",
    "",
    "## Summary",
    "",
    `- Total tracked mechanics: ${entries.length}`,
    ...statusOrder.map((status) => `- ${formatStatus(status)}: ${totalCounts[status]}`),
    "",
  ];

  for (const [area, areaEntries] of [...groupedEntries.entries()].sort((left, right) =>
    left[0].localeCompare(right[0])
  )) {
    const counts = countByStatus(areaEntries);
    lines.push(`## ${area}`);
    lines.push("");
    lines.push(
      `- Total: ${areaEntries.length}`,
      `- Full: ${counts.full}`,
      `- Partial: ${counts.partial}`,
      `- None: ${counts.none}`,
      "",
      "| Mechanic | Status | Notes | Refs |",
      "| --- | --- | --- | --- |",
    );

    for (const entry of areaEntries) {
      lines.push(
        `| ${entry.name} | ${formatStatus(entry.status)} | ${entry.summary} | ${formatRefs(entry.refs)} |`,
      );
    }

    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main(): Promise<void> {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const reportDir = path.join(rootDir, "docs", "reports");
  const reportPath = path.join(reportDir, "srd-mechanics-coverage.md");
  const markdown = buildMarkdown(srd2024MechanicsCoverage);

  await mkdir(reportDir, { recursive: true });
  await writeFile(reportPath, markdown, "utf8");

  const counts = countByStatus(srd2024MechanicsCoverage);
  process.stdout.write(
    `Wrote ${reportPath}\nTracked mechanics: ${srd2024MechanicsCoverage.length} total, ${counts.full} full, ${counts.partial} partial, ${counts.none} none\n`,
  );
}

await main();
