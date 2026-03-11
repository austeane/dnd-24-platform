import { ProseContent } from "../ui/ProseContent.tsx";

export interface CompendiumEntryProps {
  entityId: string;
  packId: string;
  type: string;
  name: string;
  summary: string | null;
  tags: string[];
}

export interface CompendiumEntryDetailProps extends CompendiumEntryProps {
  bodyMd: string;
}

export interface CompendiumPanelProps {
  entries: CompendiumEntryProps[];
  totalCount: number;
  availableTypes: string[];
  availablePacks: string[];
  query: string;
  activeType: string;
  activePack: string;
  detail: CompendiumEntryDetailProps | null;
  onQueryChange: (q: string) => void;
  onTypeChange: (type: string) => void;
  onPackChange: (pack: string) => void;
  onEntrySelect: (packId: string, entityId: string) => void;
  onBackToList: () => void;
}

const typeLabels: Record<string, string> = {
  spell: "Spell",
  rule: "Rule",
  condition: "Condition",
  equipment: "Equipment",
  feat: "Feat",
  species: "Species",
  class: "Class",
  "class-feature": "Class Feature",
  "aa-ability": "AA Ability",
};

const typeColors: Record<string, string> = {
  spell: "bg-sky/15 text-sky",
  rule: "bg-ink-soft/15 text-ink-soft",
  condition: "bg-ember/15 text-ember",
  equipment: "bg-brass/20 text-wood",
  feat: "bg-forest/15 text-forest",
  species: "bg-ember-glow/15 text-ember",
  class: "bg-wood/15 text-wood",
  "class-feature": "bg-wood-light/15 text-wood-light",
  "aa-ability": "bg-forest/15 text-forest",
};

const packLabels: Record<string, string> = {
  "srd-5e-2024": "SRD 2024",
  "advanced-adventurers": "Advanced Adventurers",
  "campaign-private": "Campaign",
};

function EntryDetailView({
  detail,
  onBack,
}: {
  detail: CompendiumEntryDetailProps;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="compendium-back-link"
      >
        <span aria-hidden="true">&larr;</span> Back to list
      </button>
      <div className="compendium-detail-card">
        <div className="compendium-detail-header">
          <div className="min-w-0">
            <div className="tavern-page-kicker">Reference Entry</div>
            <h2 className="compendium-detail-title">
              {detail.name}
            </h2>
            {detail.summary && (
              <p className="compendium-detail-summary">{detail.summary}</p>
            )}
          </div>
          <div className="compendium-detail-meta">
            <span
              className={`inline-block rounded-[var(--radius-tag)] px-2.5 py-0.5 text-xs font-medium ${typeColors[detail.type] ?? "bg-border-light text-ink-soft"}`}
            >
              {typeLabels[detail.type] ?? detail.type}
            </span>
            <span className="compendium-pack-label">
              {packLabels[detail.packId] ?? detail.packId}
            </span>
          </div>
        </div>
        {detail.tags.length > 0 && (
          <div className="compendium-tag-list">
            {detail.tags.map((tag) => (
              <span
                key={tag}
                className="compendium-tag"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="compendium-detail-body">
          <ProseContent content={detail.bodyMd} className="compendium-detail-prose" />
        </div>
      </div>
    </div>
  );
}

export function CompendiumPanel({
  entries,
  totalCount,
  availableTypes,
  availablePacks,
  query,
  activeType,
  activePack,
  detail,
  onQueryChange,
  onTypeChange,
  onPackChange,
  onEntrySelect,
  onBackToList,
}: CompendiumPanelProps) {
  if (detail) {
      return <EntryDetailView detail={detail} onBack={onBackToList} />;
  }

  return (
    <div className="space-y-4">
      <div className="compendium-search-card">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="tavern-page-kicker">Reference Library</div>
            <div className="font-heading text-xl font-bold text-ink">Search the compendium</div>
          </div>
          <div className="text-xs text-ink-soft">
            {totalCount} {totalCount === 1 ? "entry" : "entries"}
          </div>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search the compendium..."
          className="w-full rounded-[var(--radius-button)] border border-border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-wood focus:outline-none focus:ring-1 focus:ring-wood/30"
          aria-label="Search compendium entries"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip
            label="All Types"
            ariaLabel="Filter type: all"
            isActive={activeType === ""}
            onClick={() => onTypeChange("")}
          />
          {availableTypes.map((type) => (
            <FilterChip
              key={type}
              label={typeLabels[type] ?? type}
              ariaLabel={`Filter type: ${typeLabels[type] ?? type}`}
              isActive={activeType === type}
              onClick={() => onTypeChange(type)}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterChip
            label="All Packs"
            ariaLabel="Filter pack: all"
            isActive={activePack === ""}
            onClick={() => onPackChange("")}
          />
          {availablePacks.map((pack) => (
            <FilterChip
              key={pack}
              label={packLabels[pack] ?? pack}
              ariaLabel={`Filter pack: ${packLabels[pack] ?? pack}`}
              isActive={activePack === pack}
              onClick={() => onPackChange(pack)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <button
            key={`${entry.packId}:${entry.entityId}`}
            type="button"
            onClick={() => onEntrySelect(entry.packId, entry.entityId)}
            className="compendium-entry-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-heading text-base font-bold text-ink">
                  {entry.name}
                </h3>
                {entry.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                    {entry.summary}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`inline-block rounded-[var(--radius-tag)] px-2 py-0.5 text-xs font-medium ${typeColors[entry.type] ?? "bg-border-light text-ink-soft"}`}
                >
                  {typeLabels[entry.type] ?? entry.type}
                </span>
                <span className="text-xs text-ink-soft">
                  {packLabels[entry.packId] ?? entry.packId}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  ariaLabel,
  isActive,
  onClick,
}: {
  label: string;
  ariaLabel: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`filter-chip ${isActive ? "is-active" : ""}`}
    >
      {label}
    </button>
  );
}
