export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({
  icon = "\u2727",
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 text-4xl text-border">{icon}</div>
      <h3 className="mb-1 font-heading text-lg font-bold text-ink">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-ink-soft">{description}</p>
      )}
    </div>
  );
}
