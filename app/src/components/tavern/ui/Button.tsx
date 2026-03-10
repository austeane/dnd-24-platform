export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "warm" | "outline";
}

export function Button({
  variant = "warm",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    warm: "bg-ember text-cream hover:bg-ember-glow aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-ember",
    outline:
      "border border-border bg-paper text-ink-soft hover:border-wood-light hover:bg-cream aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-paper aria-disabled:hover:border-border",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
