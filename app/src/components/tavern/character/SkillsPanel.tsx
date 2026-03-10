import { Card, CardHeader } from "../ui/Card.tsx";

export interface SkillEntry {
  name: string;
  bonus: number;
  proficient: boolean;
  expertise: boolean;
}

export interface SkillsPanelProps {
  skills: SkillEntry[];
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function SkillsPanel({ skills }: SkillsPanelProps) {
  return (
    <Card style={{ gridArea: "skills" }}>
      <CardHeader title="Skills" count={skills.length} />
      <div className="divide-y divide-border-light">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className="flex items-center justify-between px-4 py-1.5"
          >
            <div className="flex items-center gap-2">
              <ProficiencyDot
                proficient={skill.proficient}
                expertise={skill.expertise}
              />
              <span className="text-sm text-ink">{skill.name}</span>
            </div>
            <span className="font-mono text-sm font-medium text-ink-soft">
              {formatModifier(skill.bonus)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProficiencyDot({
  proficient,
  expertise,
}: {
  proficient: boolean;
  expertise: boolean;
}) {
  if (expertise) {
    return (
      <span
        className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-ember"
        aria-label="Expertise"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-cream" />
      </span>
    );
  }

  if (proficient) {
    return (
      <span
        className="inline-block h-3 w-3 rounded-full bg-ember"
        aria-label="Proficient"
      />
    );
  }

  return (
    <span
      className="inline-block h-3 w-3 rounded-full border border-border bg-paper"
      aria-label="Not proficient"
    />
  );
}
