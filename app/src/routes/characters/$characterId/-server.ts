import { createServerFn } from "@tanstack/react-start";
import { getCharacterShellData } from "../../../server/tavern/character-shell.ts";
import { getCompendiumData } from "../../../server/tavern/compendium.ts";
import { getInventoryItemsData } from "../../../server/tavern/inventory.ts";
import { getJournalData } from "../../../server/tavern/journal.ts";
import type {
  TavernCompendiumData,
  TavernCompendiumQuery,
  TavernInventoryItemsData,
  TavernJournalData,
  TavernShellData,
} from "../../../server/tavern/types.ts";

export type {
  TavernCompendiumData,
  TavernCompendiumQuery,
  TavernInventoryItemsData,
  TavernJournalData,
  TavernShellData,
};

export const fetchCharacterShellData = createServerFn({ method: "GET" })
  .inputValidator((input: { characterId: string }) => input)
  .handler(async ({ data }) => getCharacterShellData(data.characterId));

export const fetchInventoryItemsData = createServerFn({ method: "GET" })
  .inputValidator((input: { characterId: string }) => input)
  .handler(async ({ data }) => getInventoryItemsData(data.characterId));

export const fetchJournalData = createServerFn({ method: "GET" })
  .inputValidator((input: { characterId: string }) => input)
  .handler(async ({ data }) => getJournalData(data.characterId));

export const fetchCompendiumData = createServerFn({ method: "GET" })
  .inputValidator((input: TavernCompendiumQuery) => input)
  .handler(async ({ data }) => getCompendiumData(data));
