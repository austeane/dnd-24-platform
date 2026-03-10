export interface SlotDotsProps {
  total: number;
  used: number;
  label?: string;
}

export function SlotDots({ total, used, label }: SlotDotsProps) {
  const remaining = Math.max(0, total - used);

  return (
    <div
      className="inline-flex items-center gap-1"
      role="group"
      aria-label={label ?? `${remaining} of ${total} slots remaining`}
    >
      {Array.from({ length: total }, (_, i) => {
        const filled = i < remaining;
        return (
          <span
            key={i}
            className={`inline-block h-2.5 w-2.5 rounded-full border ${
              filled
                ? "border-ember bg-ember"
                : "border-border bg-paper"
            }`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
