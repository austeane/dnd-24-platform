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
  const proficientCount = skills.filter(
    (skill) => skill.proficient || skill.expertise,
  ).length;

  return (
    <Card style={{ gridArea: "skills" }}>
      <CardHeader title="Skills" count={`${proficientCount} prof`} countTone="skills" />
      <div className="card-body">
        {skills.map((skill) => (
          <div key={skill.name} className="skill-item">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <ProficiencyDot
                proficient={skill.proficient}
                expertise={skill.expertise}
              />
              <span className="skill-name">{skill.name}</span>
            </div>
            <span className="skill-bonus">
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
        className="skill-dot prof inline-flex items-center justify-center"
        aria-label="Expertise"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-cream" />
      </span>
    );
  }

  if (proficient) {
    return (
      <span
        className="skill-dot prof inline-block"
        aria-label="Proficient"
      />
    );
  }

  return (
    <span
      className="skill-dot inline-block"
      aria-label="Not proficient"
    />
  );
}
