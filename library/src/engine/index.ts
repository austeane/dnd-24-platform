// Engine module — to be implemented after parsers produce typed data.
//
// Planned modules:
// - character-computer.ts: Compute CharacterState from SourceWithEffects[]
// - prerequisite-evaluator.ts: Evaluate AAPrerequisite[] against CharacterState
// - effect-resolver.ts: Resolve and deduplicate Effects from multiple Sources
// - explanation.ts: Generate ModifierExplanation breakdowns

export const ENGINE_VERSION = "0.0.1" as const;
