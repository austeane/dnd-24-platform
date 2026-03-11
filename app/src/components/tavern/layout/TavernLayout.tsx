import { TAVERN_MAIN_CONTENT_ID } from "./accessibility.ts";

export interface TavernLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function TavernLayout({ children, className = "" }: TavernLayoutProps) {
  return (
    <main
      id={TAVERN_MAIN_CONTENT_ID}
      tabIndex={-1}
      className={`tavern-main relative z-1 mx-auto max-w-[1120px] px-4 py-6 sm:px-8 sm:py-10 ${className}`}
    >
      {children}
    </main>
  );
}
