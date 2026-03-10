import { createServerFn } from "@tanstack/react-start";
import type { CharacterShellData } from "../../../server/tavern/character-shell.ts";
import type { SpellbookData } from "../../../server/tavern/spellbook.ts";
import type { InventoryData } from "../../../server/tavern/inventory.ts";
import type { JournalData } from "../../../server/tavern/journal.ts";
import type {
  CompendiumData,
  CompendiumEntryDetail,
  CompendiumFilters,
} from "../../../server/tavern/compendium.ts";

export type { CharacterShellData, SpellbookData, InventoryData, JournalData, CompendiumData, CompendiumEntryDetail, CompendiumFilters };

// Variable-based paths prevent Rollup from statically resolving the imports
// during the client build. The handlers only execute server-side at runtime.
const shellMod = "../../../server/tavern/character-shell" + ".ts";
const spellbookMod = "../../../server/tavern/spellbook" + ".ts";
const inventoryMod = "../../../server/tavern/inventory" + ".ts";
const journalMod = "../../../server/tavern/journal" + ".ts";
const compendiumMod = "../../../server/tavern/compendium" + ".ts";

export const fetchCharacterShellData = createServerFn({ method: "GET" })
  .inputValidator((input: { characterId: string }) => input)
  .handler(
    (async ({ data }: { data: { characterId: string } }) => {
      const { getCharacterShellData } = await import(/* @vite-ignore */ shellMod);
      return getCharacterShellData(data.characterId);
    }) as never,
  ) as unknown as (opts: {
    data: { characterId: string };
  }) => Promise<CharacterShellData | null>;

export const fetchSpellbookData = createServerFn({ method: "GET" })
  .inputValidator((input: { characterId: string }) => input)
  .handler(
    (async ({ data }: { data: { characterId: string } }) => {
      const { getSpellbookData } = await import(/* @vite-ignore */ spellbookMod);
      return getSpellbookData(data.characterId);
    }) as never,
  ) as unknown as (opts: {
    data: { characterId: string };
  }) => Promise<SpellbookData>;

export const fetchInventoryData = createServerFn({ method: "GET" })
  .inputValidator((input: { characterId: string }) => input)
  .handler(
    (async ({ data }: { data: { characterId: string } }) => {
      const { getInventoryData } = await import(/* @vite-ignore */ inventoryMod);
      return getInventoryData(data.characterId);
    }) as never,
  ) as unknown as (opts: {
    data: { characterId: string };
  }) => Promise<InventoryData>;

export const fetchJournalData = createServerFn({ method: "GET" })
  .inputValidator((input: { characterId: string }) => input)
  .handler(
    (async ({ data }: { data: { characterId: string } }) => {
      const { getJournalData } = await import(/* @vite-ignore */ journalMod);
      return getJournalData(data.characterId);
    }) as never,
  ) as unknown as (opts: {
    data: { characterId: string };
  }) => Promise<JournalData>;

export const fetchCompendiumData = createServerFn({ method: "GET" })
  .inputValidator((input: CompendiumFilters) => input)
  .handler(
    (async ({ data }: { data: CompendiumFilters }) => {
      const { getCompendiumData } = await import(/* @vite-ignore */ compendiumMod);
      return getCompendiumData(data);
    }) as never,
  ) as unknown as (opts: {
    data: CompendiumFilters;
  }) => Promise<CompendiumData>;

export const fetchCompendiumEntryDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { packId: string; entityId: string }) => input)
  .handler(
    (async ({ data }: { data: { packId: string; entityId: string } }) => {
      const { getCompendiumEntryDetail } = await import(/* @vite-ignore */ compendiumMod);
      return getCompendiumEntryDetail(data.packId, data.entityId);
    }) as never,
  ) as unknown as (opts: {
    data: { packId: string; entityId: string };
  }) => Promise<CompendiumEntryDetail | null>;
