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
    <div className="empty-state-shell">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-copy">{description}</p>
      )}
    </div>
  );
}
