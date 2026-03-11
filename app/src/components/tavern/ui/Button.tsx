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
  const variants = {
    warm: "btn btn-warm",
    outline: "btn btn-outline",
  };

  return (
    <button
      className={`${variants[variant]} inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
