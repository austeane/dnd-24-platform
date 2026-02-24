export interface Condition {
  name: string;
  description: string;
  /** Mechanical bullet points of what the condition does */
  effects: string[];
}

export interface Rule {
  name: string;
  description: string;
}
