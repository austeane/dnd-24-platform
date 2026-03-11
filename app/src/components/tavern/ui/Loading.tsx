export interface LoadingProps {
  label?: string;
}

export function Loading({ label = "Loading..." }: LoadingProps) {
  return (
    <div className="flex items-center justify-center py-16" role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-ember" />
        <h1 className="font-body text-sm text-ink-soft" tabIndex={-1}>
          {label}
        </h1>
      </div>
    </div>
  );
}
