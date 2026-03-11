import { EmptyState } from "../ui/EmptyState.tsx";
import { ProseContent } from "../ui/ProseContent.tsx";

export interface JournalCardProps {
  id: string;
  title: string;
  bodyMd: string;
  summary: string | null;
  category: string;
  isPinned: boolean;
  publishedAt: string;
}

export interface JournalPanelProps {
  cards: JournalCardProps[];
}

const categoryLabels: Record<string, string> = {
  message: "Message",
  handout: "Handout",
  "rule-callout": "Rule",
};

const categoryColors: Record<string, string> = {
  message: "bg-sky/15 text-sky",
  handout: "bg-ember/15 text-ember",
  "rule-callout": "bg-forest/15 text-forest",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function JournalPanel({ cards }: JournalPanelProps) {
  if (cards.length === 0) {
    return (
      <EmptyState
        icon="\uD83D\uDCDC"
        title="No Journal Entries"
        description="Your DM hasn't posted any updates yet. Check back during the next session."
      />
    );
  }

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <article key={card.id} className="journal-entry-card">
          <div className="journal-entry-header">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-bold text-ink">
                {card.title}
              </h3>
              {card.isPinned && (
                <span
                  className="text-xs text-brass"
                  title="Pinned"
                  aria-label="Pinned entry"
                >
                  {"\u{1F4CC}"}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`inline-block rounded-[var(--radius-tag)] px-2.5 py-0.5 text-xs font-medium ${categoryColors[card.category] ?? "bg-border-light text-ink-soft"}`}
              >
                {categoryLabels[card.category] ?? card.category}
              </span>
              <time
                className="text-xs text-ink-soft"
                dateTime={card.publishedAt}
              >
                {formatDate(card.publishedAt)}
              </time>
            </div>
          </div>
          {card.summary && (
            <p className="journal-summary">{card.summary}</p>
          )}
          <ProseContent content={card.bodyMd} />
        </article>
      ))}
    </div>
  );
}
