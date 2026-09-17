export type StrategyKind = "testId" | "role" | "label" | "placeholder" | "text" | "css" | "xpath";

export interface RoleOptions {
  name?: string;
  exact?: boolean;
}

export interface LocatorCandidate {
  strategy: StrategyKind;
  value: string;
  roleOptions?: RoleOptions;
}

export interface HealingEvent {
  timestamp: string;
  previousPrimary: LocatorCandidate;
  healedWith: LocatorCandidate;
  healedIndex: number;
}

export interface LocatorDescriptor {
  id: string;
  description: string;
  candidates: LocatorCandidate[];
  healHistory?: HealingEvent[];
}

export type LocatorPageFile = Record<string, LocatorDescriptor>;
