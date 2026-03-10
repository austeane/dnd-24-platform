export interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorCardProps) {
  return (
    <div className="tavern-card mx-auto max-w-lg p-8 text-center">
      <div className="mb-3 text-3xl">&#9888;</div>
      <h2 className="mb-2 font-heading text-lg font-bold text-ink">{title}</h2>
      <p className="mb-4 text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[var(--radius-button)] border border-border bg-paper px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-wood-light hover:bg-cream"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
