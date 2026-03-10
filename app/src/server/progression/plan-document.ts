import type { PackId } from "@dnd/library";
import type { CharacterSourceKind } from "../db/schema/index.ts";
import type {
  CanonicalSourceSpendPlanOperation,
  CharacterSpendPlanDocument,
  CharacterSpendPlanOperation,
  ClassLevelSpendPlanOperation,
  SpellAccessSpendPlanOperation,
} from "./types.ts";

const packIds = new Set<PackId>([
  "srd-5e-2024",
  "advanced-adventurers",
  "campaign-private",
]);
const sourceKinds = new Set<CharacterSourceKind>([
  "class-level",
  "class-feature",
  "subclass-feature",
  "species",
  "background",
  "feat",
  "aa-purchase",
  "magic-item",
  "equipment",
  "condition",
  "override",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${path}: expected non-empty string`);
  }

  return value.trim();
}

function expectOptionalString(value: unknown, path: string): string | undefined {
  if (value == null) {
    return undefined;
  }

  return expectString(value, path);
}

function expectInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isInteger(value)) {
    throw new Error(`${path}: expected integer`);
  }

  return value;
}

function expectPositiveInteger(value: unknown, path: string): number {
  const parsed = expectInteger(value, path);
  if (parsed <= 0) {
    throw new Error(`${path}: expected positive integer`);
  }

  return parsed;
}

function expectNonNegativeInteger(value: unknown, path: string): number {
  const parsed = expectInteger(value, path);
  if (parsed < 0) {
    throw new Error(`${path}: expected non-negative integer`);
  }

  return parsed;
}

function expectOptionalStringArray(value: unknown, path: string): string[] | undefined {
  if (value == null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`${path}: expected string array`);
  }

  return value.map((entry, index) => expectString(entry, `${path}[${index}]`));
}

function expectPackId(value: unknown, path: string): PackId {
  const packId = expectString(value, path) as PackId;
  if (!packIds.has(packId)) {
    throw new Error(`${path}: unsupported packId "${packId}"`);
  }

  return packId;
}

function expectSourceKind(value: unknown, path: string): CharacterSourceKind {
  const sourceKind = expectString(value, path) as CharacterSourceKind;
  if (!sourceKinds.has(sourceKind)) {
    throw new Error(`${path}: unsupported sourceKind "${sourceKind}"`);
  }

  return sourceKind;
}

function parseClassLevelOperation(
  value: Record<string, unknown>,
  path: string,
): ClassLevelSpendPlanOperation {
  return {
    type: "class-level",
    classEntityId: expectString(value.classEntityId, `${path}.classEntityId`),
    classPackId: expectPackId(value.classPackId, `${path}.classPackId`),
    levelsGranted: expectPositiveInteger(value.levelsGranted, `${path}.levelsGranted`),
    xpCost: expectNonNegativeInteger(value.xpCost, `${path}.xpCost`),
    label: expectOptionalString(value.label, `${path}.label`),
    notes: expectOptionalStringArray(value.notes, `${path}.notes`),
  };
}

function parseCanonicalSourceOperation(
  value: Record<string, unknown>,
  path: string,
): CanonicalSourceSpendPlanOperation {
  const sourceKind = expectSourceKind(value.sourceKind, `${path}.sourceKind`);
  if (sourceKind === "override" || sourceKind === "condition") {
    throw new Error(`${path}.sourceKind: unsupported spend-plan source kind "${sourceKind}"`);
  }

  const payload = value.payload;
  if (payload != null && !isRecord(payload)) {
    throw new Error(`${path}.payload: expected object`);
  }

  return {
    type: "canonical-source",
    sourceKind,
    entityId: expectString(value.entityId, `${path}.entityId`),
    packId: expectPackId(value.packId, `${path}.packId`),
    xpCost: expectNonNegativeInteger(value.xpCost, `${path}.xpCost`),
    label: expectOptionalString(value.label, `${path}.label`),
    rank: value.rank == null ? undefined : expectPositiveInteger(value.rank, `${path}.rank`),
    notes: expectOptionalStringArray(value.notes, `${path}.notes`),
    payload: payload as Record<string, unknown> | undefined,
  };
}

function parseSpellAccessOperation(
  value: Record<string, unknown>,
  path: string,
): SpellAccessSpendPlanOperation {
  const sourceKind = expectSourceKind(value.sourceKind, `${path}.sourceKind`);
  if (sourceKind !== "class-feature" && sourceKind !== "aa-purchase") {
    throw new Error(`${path}.sourceKind: spell-access source kind must be class-feature or aa-purchase`);
  }

  return {
    type: "spell-access",
    spellName: expectString(value.spellName, `${path}.spellName`),
    spellEntityId: expectOptionalString(value.spellEntityId, `${path}.spellEntityId`),
    spellPackId: value.spellPackId == null
      ? undefined
      : expectPackId(value.spellPackId, `${path}.spellPackId`),
    sourceKind,
    sourceEntityId: expectOptionalString(value.sourceEntityId, `${path}.sourceEntityId`),
    sourcePackId: value.sourcePackId == null
      ? undefined
      : expectPackId(value.sourcePackId, `${path}.sourcePackId`),
    sourceLabel: expectString(value.sourceLabel, `${path}.sourceLabel`),
    alwaysPrepared: value.alwaysPrepared == null ? undefined : Boolean(value.alwaysPrepared),
    xpCost: expectNonNegativeInteger(value.xpCost, `${path}.xpCost`),
    notes: expectOptionalStringArray(value.notes, `${path}.notes`),
  };
}

function parseOperation(value: unknown, path: string): CharacterSpendPlanOperation {
  const record = isRecord(value)
    ? value
    : (() => {
        throw new Error(`${path}: expected object`);
      })();
  const type = expectString(record.type, `${path}.type`);

  switch (type) {
    case "class-level":
      return parseClassLevelOperation(record, path);
    case "canonical-source":
      return parseCanonicalSourceOperation(record, path);
    case "spell-access":
      return parseSpellAccessOperation(record, path);
    default:
      throw new Error(`${path}.type: unsupported operation "${type}"`);
  }
}

export function parseCharacterSpendPlanDocument(value: unknown): CharacterSpendPlanDocument {
  const record = isRecord(value)
    ? value
    : (() => {
        throw new Error("planJson: expected object");
      })();
  const version = expectInteger(record.version, "planJson.version");
  if (version !== 1) {
    throw new Error(`planJson.version: expected 1, received ${version}`);
  }
  if (!Array.isArray(record.operations) || record.operations.length === 0) {
    throw new Error("planJson.operations: expected at least one operation");
  }

  return {
    version: 1,
    operations: record.operations.map((entry, index) =>
      parseOperation(entry, `planJson.operations[${index}]`)
    ),
  };
}

export function getCharacterSpendPlanTotalXpCost(
  document: CharacterSpendPlanDocument,
): number {
  return document.operations.reduce((sum, operation) => sum + operation.xpCost, 0);
}
