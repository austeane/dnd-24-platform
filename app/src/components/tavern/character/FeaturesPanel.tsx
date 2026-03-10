import { Card, CardHeader } from "../ui/Card.tsx";

export interface FeatureEntry {
  name: string;
  origin: string;
}

export interface FeaturesPanelProps {
  features: FeatureEntry[];
}

export function FeaturesPanel({ features }: FeaturesPanelProps) {
  return (
    <Card style={{ gridArea: "features" }}>
      <CardHeader title="Features" count={features.length} />
      <div className="divide-y divide-border-light">
        {features.map((feature, i) => (
          <div key={`${feature.name}-${i}`} className="px-4 py-2.5">
            <div className="text-sm font-semibold text-ink">
              {feature.name}
            </div>
            <div className="text-xs text-ink-soft">{feature.origin}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
