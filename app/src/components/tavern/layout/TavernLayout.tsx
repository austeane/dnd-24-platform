export interface TavernLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function TavernLayout({ children, className = "" }: TavernLayoutProps) {
  return (
    <main
      className={`relative z-1 mx-auto max-w-6xl px-4 py-6 sm:px-6 ${className}`}
    >
      {children}
    </main>
  );
}
