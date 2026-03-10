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
  abbreviation,
  score,
  modifier,
  isPrimary,
}: AbilityScoreCardProps) {
  return (
    <div
      className={`tavern-card flex flex-col items-center rounded-[var(--radius-ability)] px-3 py-3 ${
        isPrimary ? "ring-2 ring-ember/40" : ""
      }`}
      data-primary={isPrimary || undefined}
      aria-label={`${name}: ${score} (${formatModifier(modifier)})`}
    >
      <span className="text-[10px] font-semibold tracking-wider text-ink-soft uppercase">
        {abbreviation}
      </span>
      <span className="font-heading text-2xl font-bold text-ink">
        {formatModifier(modifier)}
      </span>
      <span className="font-mono text-xs text-ink-soft">{score}</span>
    </div>
  );
}
