export interface ProgressBarProps {
  current: number;
  max: number;
  variant?: "hp" | "xp";
  label?: string;
  showNumbers?: boolean;
}

export function ProgressBar({
  current,
  max,
  variant = "hp",
  label,
  showNumbers = true,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

  const trackColors = {
    hp: "bg-border-light",
    xp: "bg-border-light",
  };

  const fillColors = {
    hp: "bg-forest",
    xp: "bg-ember",
  };

  return (
    <div className="space-y-1">
      {(label || showNumbers) && (
        <div className="flex items-center justify-between text-xs">
          {label && (
            <span className="font-semibold text-ink-soft">{label}</span>
          )}
          {showNumbers && (
            <span className="font-mono text-ink-soft">
              {current} / {max}
            </span>
          )}
        </div>
      )}
      <div
        className={`h-2.5 w-full overflow-hidden rounded-[var(--radius-tag)] ${trackColors[variant]}`}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? `${variant === "hp" ? "Hit Points" : "Experience"}`}
      >
        <div
          className={`h-full rounded-[var(--radius-tag)] transition-[width] duration-300 ${fillColors[variant]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
