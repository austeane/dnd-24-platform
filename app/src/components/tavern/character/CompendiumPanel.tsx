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
        className="mb-4 flex items-center gap-1 text-sm font-medium text-wood hover:text-ember"
      >
        <span aria-hidden="true">&larr;</span> Back to list
      </button>
      <div className="tavern-card p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-heading text-2xl font-bold text-ink">
            {detail.name}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`inline-block rounded-[var(--radius-tag)] px-2.5 py-0.5 text-xs font-medium ${typeColors[detail.type] ?? "bg-border-light text-ink-soft"}`}
            >
              {typeLabels[detail.type] ?? detail.type}
            </span>
            <span className="text-xs text-ink-soft">
              {packLabels[detail.packId] ?? detail.packId}
            </span>
          </div>
        </div>
        {detail.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {detail.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[var(--radius-tag)] bg-cream-warm px-2 py-0.5 text-xs text-ink-soft"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <ProseContent content={detail.bodyMd} />
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
      <div className="tavern-card p-4">
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
            isActive={activeType === ""}
            onClick={() => onTypeChange("")}
          />
          {availableTypes.map((type) => (
            <FilterChip
              key={type}
              label={typeLabels[type] ?? type}
              isActive={activeType === type}
              onClick={() => onTypeChange(type)}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterChip
            label="All Packs"
            isActive={activePack === ""}
            onClick={() => onPackChange("")}
          />
          {availablePacks.map((pack) => (
            <FilterChip
              key={pack}
              label={packLabels[pack] ?? pack}
              isActive={activePack === pack}
              onClick={() => onPackChange(pack)}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        {totalCount} {totalCount === 1 ? "entry" : "entries"} found
      </p>

      <div className="space-y-2">
        {entries.map((entry) => (
          <button
            key={`${entry.packId}:${entry.entityId}`}
            type="button"
            onClick={() => onEntrySelect(entry.packId, entry.entityId)}
            className="tavern-card w-full cursor-pointer p-4 text-left transition-shadow hover:shadow-[var(--shadow-tavern-md)]"
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
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[var(--radius-tag)] px-3 py-1 text-xs font-medium transition-colors ${
        isActive
          ? "bg-wood text-cream"
          : "bg-cream-warm text-ink-soft hover:bg-border-light hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
