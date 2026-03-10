export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className = "", style }: CardProps) {
  return (
    <div className={`tavern-card ${className}`} style={style}>
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: string;
  count?: number;
  children?: React.ReactNode;
}

export function CardHeader({ title, count, children }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border-light px-5 py-3">
      <div className="flex items-center gap-2">
        <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
        {count !== undefined && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[var(--radius-tag)] bg-parchment px-1.5 font-mono text-xs text-ink-soft">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
