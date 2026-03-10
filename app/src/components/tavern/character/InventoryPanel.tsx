import { EmptyState } from "../ui/EmptyState.tsx";

export interface InventoryItemProps {
  id: string;
  name: string;
  quantity: number;
  equipped: boolean;
  slot: string | null;
}

export interface AttackProfileProps {
  weaponName: string;
  attackBonus: string;
  damage: string;
  damageType: string;
  properties: string[];
  masteryProperty: string | null;
}

export interface ResourceProps {
  name: string;
  current: number;
  max: number;
  rechargeOn: string;
  source: string;
}

export interface InventoryPanelProps {
  equippedItems: InventoryItemProps[];
  carriedItems: InventoryItemProps[];
  attackProfiles: AttackProfileProps[];
  resources: ResourceProps[];
}

function ItemRow({ item }: { item: InventoryItemProps }) {
  return (
    <div className="flex items-center justify-between border-b border-border-light/60 px-3 py-2 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">{item.name}</span>
        {item.quantity > 1 && (
          <span className="text-xs text-ink-soft">x{item.quantity}</span>
        )}
      </div>
      {item.slot && (
        <span className="rounded-[var(--radius-tag)] bg-cream-warm px-2 py-0.5 text-[10px] font-medium text-ink-soft">
          {item.slot}
        </span>
      )}
    </div>
  );
}

function AttackRow({ profile }: { profile: AttackProfileProps }) {
  return (
    <div className="flex items-center justify-between border-b border-border-light/60 px-3 py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-ink">{profile.weaponName}</span>
        {profile.masteryProperty && (
          <span className="ml-1.5 inline-block rounded-[var(--radius-tag)] bg-ember/10 px-1.5 py-0.5 text-[10px] font-medium text-ember">
            {profile.masteryProperty}
          </span>
        )}
        {profile.properties.length > 0 && (
          <div className="mt-0.5 text-[11px] text-ink-soft">
            {profile.properties.join(", ")}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <span className="font-heading font-bold text-ink">{profile.attackBonus}</span>
        <span className="text-border">|</span>
        <span className="text-ink">
          {profile.damage}{" "}
          <span className="text-[11px] text-ink-soft">{profile.damageType}</span>
        </span>
      </div>
    </div>
  );
}

function ResourceBar({ resource }: { resource: ResourceProps }) {
  const pct = resource.max > 0 ? (resource.current / resource.max) * 100 : 0;
  return (
    <div className="border-b border-border-light/60 px-3 py-2 last:border-b-0">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-ink">{resource.name}</span>
          <span className="ml-1.5 text-[11px] text-ink-soft">({resource.rechargeOn})</span>
        </div>
        <span className="text-sm font-heading font-bold text-ink">
          {resource.current}/{resource.max}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-cream-warm">
        <div
          className="h-full rounded-full bg-ember transition-all"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={resource.current}
          aria-valuemin={0}
          aria-valuemax={resource.max}
          aria-label={`${resource.name}: ${resource.current} of ${resource.max}`}
        />
      </div>
      <div className="mt-0.5 text-[10px] text-ink-soft">{resource.source}</div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: string;
}) {
  return (
    <div className="tavern-card overflow-hidden">
      <div className="bg-cream-warm/50 px-3 py-2">
        <h4 className="font-heading text-sm font-bold text-ink">{title}</h4>
      </div>
      {children ?? (
        <div className="px-3 py-3 text-center text-xs text-ink-soft">
          {empty ?? "None"}
        </div>
      )}
    </div>
  );
}

export function InventoryPanel({
  equippedItems,
  carriedItems,
  attackProfiles,
  resources,
}: InventoryPanelProps) {
  const hasContent =
    equippedItems.length > 0 ||
    carriedItems.length > 0 ||
    attackProfiles.length > 0 ||
    resources.length > 0;

  if (!hasContent) {
    return (
      <EmptyState
        title="No Inventory"
        description="This character has no equipment or tracked resources."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Attack Profiles */}
      {attackProfiles.length > 0 && (
        <SectionCard title="Attacks">
          {attackProfiles.map((profile) => (
            <AttackRow key={profile.weaponName} profile={profile} />
          ))}
        </SectionCard>
      )}

      {/* Equipped Items */}
      {equippedItems.length > 0 && (
        <SectionCard title="Equipped">
          {equippedItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </SectionCard>
      )}

      {/* Carried Items */}
      {carriedItems.length > 0 && (
        <SectionCard title="Carried">
          {carriedItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </SectionCard>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <SectionCard title="Resources">
          {resources.map((resource) => (
            <ResourceBar key={resource.name} resource={resource} />
          ))}
        </SectionCard>
      )}
    </div>
  );
}
