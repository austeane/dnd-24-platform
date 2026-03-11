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
      <CardHeader title="Features" count={features.length} countTone="features" />
      <div className="feature-list">
        {features.map((feature) => (
          <div key={`${feature.name}-${feature.origin}`} className="feature-item">
            <div className="feature-name">
              {feature.name}
            </div>
            <div className="feature-origin">{feature.origin}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
