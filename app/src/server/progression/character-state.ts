import {
  type CharacterComputationInput,
  type CharacterState,
  computeCharacterState,
} from "@dnd/library";
import {
  buildCharacterComputationInput,
  buildCharacterRuntimeStateFromRows,
  loadCharacterProjectionRows,
  type CharacterProjectionRows,
} from "./projection.ts";
import type { CharacterRuntimeState } from "./types.ts";

export function buildCharacterState(
  characterId: string,
  rows: CharacterProjectionRows,
): CharacterState | null {
  return buildCharacterRuntimeStateFromRows(characterId, rows);
}

export function buildCharacterComputationState(
  characterId: string,
  rows: CharacterProjectionRows,
): CharacterComputationInput | null {
  return buildCharacterComputationInput(characterId, rows);
}

export function computeProjectedCharacterState(
  input: CharacterComputationInput,
): CharacterState {
  return computeCharacterState(input) satisfies CharacterState;
}

export async function getCharacterRuntimeState(
  characterId: string,
): Promise<CharacterRuntimeState | null> {
  const rows = await loadCharacterProjectionRows(characterId);
  return buildCharacterRuntimeStateFromRows(characterId, rows);
}
