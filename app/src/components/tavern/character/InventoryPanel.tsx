import { Button } from "../ui/Button.tsx";
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
  resourceName: string;
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
  editable?: boolean;
  onSpendResource?: (resourceName: string) => Promise<void>;
  onRestoreResource?: (resourceName: string) => Promise<void>;
}

function ItemRow({ item }: { item: InventoryItemProps }) {
  return (
    <div className="inventory-row">
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
    <div className="inventory-row">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{profile.weaponName}</div>
        {profile.masteryProperty && (
          <span className="spell-tag spell-tag-ember mt-1 inline-flex">
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

function ResourceBar({
  resource,
  editable,
  onSpendResource,
  onRestoreResource,
}: {
  resource: ResourceProps;
  editable: boolean;
  onSpendResource?: (resourceName: string) => Promise<void>;
  onRestoreResource?: (resourceName: string) => Promise<void>;
}) {
  const pct = resource.max > 0 ? (resource.current / resource.max) * 100 : 0;
  return (
    <div className="inventory-row">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-ink">{resource.name}</span>
          <span className="ml-1.5 text-[11px] text-ink-soft">({resource.rechargeOn})</span>
        </div>
        <span className="text-sm font-heading font-bold text-ink">
          {resource.current}/{resource.max}
        </span>
      </div>
      <div className="resource-track mt-1">
        <div
          className="resource-fill"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={resource.current}
          aria-valuemin={0}
          aria-valuemax={resource.max}
          aria-label={`${resource.name}: ${resource.current} of ${resource.max}`}
        />
      </div>
      <div className="mt-0.5 text-[10px] text-ink-soft">{resource.source}</div>
      {editable && (
        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="px-2 py-1 text-[10px]"
            disabled={resource.current <= 0}
            onClick={() => {
              if (!onSpendResource) return;
              void onSpendResource(resource.resourceName);
            }}
          >
            Spend
          </Button>
          <Button
            type="button"
            variant="outline"
            className="px-2 py-1 text-[10px]"
            disabled={resource.current >= resource.max}
            onClick={() => {
              if (!onRestoreResource) return;
              void onRestoreResource(resource.resourceName);
            }}
          >
            Restore
          </Button>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="inventory-section-card">
      <div className="inventory-section-header">
        <h4 className="font-heading text-sm font-bold text-ink">{title}</h4>
        {meta}
      </div>
      {children}
    </div>
  );
}

export function InventoryPanel({
  equippedItems,
  carriedItems,
  attackProfiles,
  resources,
  editable = false,
  onSpendResource,
  onRestoreResource,
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
    <div className="inventory-grid">
      {attackProfiles.length > 0 && (
        <SectionCard
          title="Attacks"
          meta={<span className="card-count">{attackProfiles.length}</span>}
        >
          {attackProfiles.map((profile) => (
            <AttackRow key={profile.weaponName} profile={profile} />
          ))}
        </SectionCard>
      )}

      {equippedItems.length > 0 && (
        <SectionCard
          title="Equipped"
          meta={<span className="card-count">{equippedItems.length}</span>}
        >
          {equippedItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </SectionCard>
      )}

      {carriedItems.length > 0 && (
        <SectionCard
          title="Carried"
          meta={<span className="card-count">{carriedItems.length}</span>}
        >
          {carriedItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </SectionCard>
      )}

      {resources.length > 0 && (
        <SectionCard
          title="Resources"
          meta={<span className="card-count combat">{resources.length}</span>}
        >
          {resources.map((resource) => (
            <ResourceBar
              key={resource.resourceName}
              resource={resource}
              editable={editable}
              onSpendResource={onSpendResource}
              onRestoreResource={onRestoreResource}
            />
          ))}
        </SectionCard>
      )}
    </div>
  );
}
