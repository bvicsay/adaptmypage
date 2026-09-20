import type { Action } from "adaptmypage";
import type { Question } from "adaptmypage/server";

export type DemoId = "pricing" | "product" | "docs" | "signup";

export interface ScenarioStep {
  /** Seconds since the visitor arrived. */
  t: number;
  type: Action["type"];
  target?: string;
  detail?: string;
}

export interface Scenario {
  id: string;
  /** Short label for the selector, e.g. "Bargain hunter". */
  label: string;
  /** One sentence describing who this is. */
  persona: string;
  referrer?: string;
  searchTerms?: string;
  returning?: boolean;
  device?: "mobile" | "desktop";
  steps: ScenarioStep[];
  /** Section dwell at the end of the scenario; scaled with progress during replay. */
  sections: Record<string, { viewedMs: number; hoverMs?: number; views?: number; label?: string }>;
}

export interface DemoConfig {
  id: DemoId;
  /** Fictional brand shown inside the frame. */
  brand: string;
  /** Hub tab title, e.g. "Pricing page". */
  name: string;
  /** One line: what changes and why it matters. */
  tagline: string;
  /** Shown on the landing page card. */
  outcome: string;
  accent: string;
  siteContext: string;
  questions: Record<string, Question>;
  scenarios: Scenario[];
  /** The route file for this demo, shown under the frames. */
  routeCode: string;
  /** One client-side example, shown under the frames. */
  clientCode: string;
}
