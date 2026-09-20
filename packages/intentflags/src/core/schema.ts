import type { IntentId, NextActionId, VisitorState } from "./types";

/**
 * The built-in intent schema. Shared verbatim between the browser (for labels
 * and typing) and the server (as the questions sent to Jev).
 *
 * Question shapes follow TypeSafe's System One API:
 *   choice → { type: "choice", instructions, criteria: Record<label, description> }
 *   score  → { type: "score",  instructions, criteria: [low, ..., high] }
 *   noul   → { type: "noul",   instructions, criteria?: { true, false } }
 */

export const INTENTS: Record<IntentId, { label: string; description: string }> = {
  exploring: {
    label: "Exploring",
    description:
      "Orienting and browsing broadly. Skims several sections, no sustained focus on any one topic yet.",
  },
  technical_evaluation: {
    label: "Technical evaluation",
    description:
      "Assessing how the product works. Reads documentation, API reference, code samples, integrations or security; hovers or copies code; returns to technical sections.",
  },
  price_comparison: {
    label: "Price comparison",
    description:
      "Focused on cost. Spends time on pricing, plans, limits or quotas; toggles between tiers; hovers prices; returns to pricing.",
  },
  ready_to_buy: {
    label: "Ready to buy",
    description:
      "Showing commitment. Heads toward sign-up or install CTAs, interacts with a form, is a returning visitor with a clear goal, or has already evaluated and priced.",
  },
  seeking_support: {
    label: "Seeking support",
    description:
      "Looking for help. Reads FAQ, troubleshooting, status or contact sections; behavior suggests an existing user with a problem.",
  },
  insufficient_signal: {
    label: "Not enough signal",
    description:
      "Too little behavior to judge: just arrived, almost no scrolling or interaction.",
  },
};

export const NEXT_ACTIONS: Record<NextActionId, { label: string; description: string }> = {
  read_docs: { label: "Read the docs", description: "Open documentation or API reference next." },
  view_pricing: { label: "View pricing", description: "Go to or return to pricing next." },
  sign_up: { label: "Sign up / install", description: "Click a sign-up, install or get-started call to action next." },
  check_integrations: { label: "Check integrations", description: "Look at frameworks, integrations or compatibility next." },
  review_security: { label: "Review security", description: "Look at security, privacy or compliance information next." },
  contact: { label: "Contact", description: "Reach out via a contact, support or email form next." },
  leave: { label: "Leave", description: "Leave the site without taking any action." },
};

export const EXPERTISE_LEVELS = [
  "Non-technical. Unfamiliar with code; avoids or skips code samples and API sections.",
  "Beginner. Curious about code but lingers on introductory material; reads slowly.",
  "Intermediate developer. Comfortable reading code samples; scans docs at a normal pace.",
  "Experienced developer. Goes straight to API reference, integrations or install commands; copies code.",
  "Senior engineer / architect. Skips marketing, inspects security, limits, self-hosting and data flow details rapidly.",
] as const;

export const FRICTION_LEVELS = [
  "None. Smooth, purposeful movement through the page.",
  "Mild. Some back-and-forth or a brief hesitation.",
  "Noticeable. Repeated returns to the same section, hesitations over controls, or re-reading.",
  "Severe. Rage clicks, erratic jumping between sections, long idle after an attempted action.",
] as const;

export const PURCHASE_INTENT_LEVELS = [
  "No buying signal. Passive browsing.",
  "Faint. Glanced at pricing or a call to action once.",
  "Moderate. Engaged with pricing or a call to action and kept reading.",
  "Strong. Compared plans, hovered the primary call to action, or started a form.",
  "Imminent. Submitted or is about to submit a form, or clicked a sign-up / install call to action.",
] as const;

/** TypeSafe / Jev question shapes. Kept structural so the SDK has no dependency on the vendor SDK. */
export type ChoiceQuestion = {
  type: "choice";
  instructions: string;
  criteria: Record<string, string | null>;
};
export type ScoreQuestion = {
  type: "score";
  instructions: string;
  criteria: readonly [string, string, ...string[]];
};
export type NoulQuestion = {
  type: "noul";
  instructions: string;
  criteria?: { true?: string; false?: string };
};
export type Question = ChoiceQuestion | ScoreQuestion | NoulQuestion;

const describe = (m: Record<string, { description: string }>): Record<string, string> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v.description]));

/** The default question set sent to Jev for every evaluation. */
export const DEFAULT_QUESTIONS = {
  intent: {
    type: "choice",
    instructions:
      "Based on the visitor's behavior on this page so far, what is the visitor currently trying to do? Judge from the sequence and timing of actions, not from any single event.",
    criteria: describe(INTENTS),
  },
  next_action: {
    type: "choice",
    instructions: "What is this visitor most likely to do next?",
    criteria: describe(NEXT_ACTIONS),
  },
  expertise: {
    type: "score",
    instructions: "How technically sophisticated does this visitor appear?",
    criteria: EXPERTISE_LEVELS,
  },
  friction: {
    type: "score",
    instructions: "How much friction or confusion is this visitor experiencing right now?",
    criteria: FRICTION_LEVELS,
  },
  purchase_intent: {
    type: "score",
    instructions: "How close is this visitor to converting (signing up, installing, or buying)?",
    criteria: PURCHASE_INTENT_LEVELS,
  },
  abandon_risk: {
    type: "noul",
    instructions:
      "The visitor is likely to leave the site within the next 30 seconds without taking any action.",
    criteria: {
      true: "Exit intent, long idle, tab switching, shallow engagement, or a completed goal with nothing left to do.",
      false: "Actively reading, scrolling into new sections, interacting with controls, or progressing toward a call to action.",
    },
  },
} as const satisfies Record<string, Question>;

export type DefaultQuestionId = keyof typeof DEFAULT_QUESTIONS;

export const INTENT_IDS = Object.keys(INTENTS) as IntentId[];
export const NEXT_ACTION_IDS = Object.keys(NEXT_ACTIONS) as NextActionId[];

function uniform<T extends string>(ids: readonly T[]): Record<T, number> {
  const p = 1 / ids.length;
  return Object.fromEntries(ids.map((id) => [id, p])) as Record<T, number>;
}

/** The state every visitor starts with before the first evaluation. */
export function initialState(): VisitorState {
  const intentP = uniform(INTENT_IDS);
  const nextP = uniform(NEXT_ACTION_IDS);
  const state: VisitorState = {
    intent: { value: "insufficient_signal", confidence: intentP.insufficient_signal, probabilities: intentP },
    nextAction: { value: "read_docs", confidence: nextP.read_docs, probabilities: nextP },
    expertise: 0.5,
    friction: 0,
    purchaseIntent: 0,
    abandonRisk: 0,
    flags: {},
    meta: { source: "initial", latencyMs: 0, evaluatedAt: 0, seq: 0 },
  };
  state.flags = buildFlags(state);
  return state;
}

/** Flatten a VisitorState into the flag map used by `useIntent()`. */
export function buildFlags(state: Omit<VisitorState, "flags">, extra?: Record<string, number>): Record<string, number> {
  const flags: Record<string, number> = {};
  for (const [k, v] of Object.entries(state.intent.probabilities)) flags[k] = v;
  for (const [k, v] of Object.entries(state.nextAction.probabilities)) flags[`next:${k}`] = v;
  flags.expertise = state.expertise;
  flags.friction = state.friction;
  flags.purchase_intent = state.purchaseIntent;
  flags.abandon_risk = state.abandonRisk;
  if (extra) Object.assign(flags, extra);
  return flags;
}
