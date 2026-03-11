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
  count?: React.ReactNode;
  countTone?: "default" | "combat" | "skills" | "features" | "spells";
  children?: React.ReactNode;
}

export function CardHeader({
  title,
  count,
  countTone = "default",
  children,
}: CardHeaderProps) {
  const countClass =
    countTone === "default" ? "card-count" : `card-count ${countTone}`;

  return (
    <div className="tavern-card-header flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-2">
        <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
        {count !== undefined && (
          <span className={countClass}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
