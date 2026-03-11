export interface AbilityScoreCardProps {
  name: string;
  abbreviation: string;
  score: number;
  modifier: number;
  isPrimary: boolean;
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function AbilityScoreCard({
  name,
  score,
  modifier,
  isPrimary,
}: AbilityScoreCardProps) {
  return (
    <div
      className="ability-card"
      data-primary={isPrimary || undefined}
      aria-label={`${name}: ${score} (${formatModifier(modifier)})`}
    >
      <span className="ability-label">{name}</span>
      <span className="ability-score">{score}</span>
      <span className="ability-mod">{formatModifier(modifier)}</span>
    </div>
  );
}
