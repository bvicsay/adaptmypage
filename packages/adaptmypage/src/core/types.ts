/**
 * IntentFlags core types.
 *
 * Everything the browser collects is a `Snapshot`. Everything the evaluator
 * returns is a `VisitorState`. The React layer only ever reads `VisitorState`.
 */

/** Built-in intent identifiers. These are the `when=` values for `<Intent>`. */
export type IntentId =
  | "exploring"
  | "technical_evaluation"
  | "price_comparison"
  | "ready_to_buy"
  | "seeking_support"
  | "insufficient_signal";

/** Built-in predicted next actions. Exposed as `next:<id>` flags. */
export type NextActionId =
  | "read_docs"
  | "view_pricing"
  | "sign_up"
  | "check_integrations"
  | "review_security"
  | "contact"
  | "leave";

/** A categorical judgment: the winning option plus the full distribution. */
export interface Judgment<T extends string = string> {
  value: T;
  /** Probability of the winning option, 0..1. */
  confidence: number;
  /** Probability per option, 0..1, sums to ~1. */
  probabilities: Record<T, number>;
}

export type StateSource = "jev" | "heuristic" | "cached" | "initial";

export interface StateMeta {
  /** Where this state came from. `heuristic` means no Jev key was configured. */
  source: StateSource;
  /** Model identifier reported by the evaluator, e.g. `jev-1.13.0`. */
  model?: string;
  /** Round-trip latency of the evaluation in milliseconds (0 for cached/initial). */
  latencyMs: number;
  /** Unix ms when this state was produced. */
  evaluatedAt: number;
  /** Monotonic sequence number for this session. */
  seq: number;
  /** Tokens billed by the model for this decision. */
  inputTokens?: number;
  /** Estimated cost of this decision in USD. */
  costUsd?: number;
}

/**
 * The semantic state of one visitor at one moment.
 * All scalar fields are 0..1. All categorical fields carry probabilities.
 */
export interface VisitorState {
  intent: Judgment<IntentId>;
  nextAction: Judgment<NextActionId>;
  /** How technically sophisticated the visitor appears (0 novice .. 1 expert). */
  expertise: number;
  /** How much the visitor seems to be struggling (0 smooth .. 1 stuck). */
  friction: number;
  /** How close the visitor seems to converting (0 .. 1). */
  purchaseIntent: number;
  /** Probability the visitor leaves within ~30s without acting (0 .. 1). */
  abandonRisk: number;
  /**
   * Flat flag map. Every intent, every next action (`next:*`), every scalar
   * and every custom question is available here by id with a 0..1 confidence.
   */
  flags: Record<string, number>;
  meta: StateMeta;
}

/** A single semantic behavioral event. Never raw coordinates. */
export interface Action {
  /** Seconds since the session started, one decimal. */
  t: number;
  type:
    | "pageview"
    | "navigate"
    | "section_enter"
    | "section_exit"
    | "click"
    | "hover"
    | "scroll"
    | "scroll_return"
    | "copy"
    | "select_text"
    | "form_focus"
    | "form_input"
    | "form_submit"
    | "tab_hidden"
    | "tab_visible"
    | "exit_intent"
    | "rage_click"
    | "hesitation"
    | "idle"
    | "resume"
    | "custom";
  /** Human-readable label of the thing acted on (button text, section id, field name). */
  target?: string;
  /** Extra detail such as dwell time ("4.2s") or scroll depth ("75%"). */
  detail?: string;
}

export interface SectionStat {
  id: string;
  label?: string;
  /** Total time the section was in the viewport, ms. */
  viewedMs: number;
  /** Total time the cursor rested inside the section, ms. */
  hoverMs: number;
  /** How many separate times the section entered the viewport. */
  views: number;
}

export interface Snapshot {
  /** Snapshot format version. */
  v: 1;
  visitorId: string;
  sessionId: string;
  sentAt: number;
  page: {
    path: string;
    title: string;
    referrer: string;
    entry: {
      path: string;
      referrer: string;
      utm: Record<string, string>;
      /** Query string parameters that look like search terms (q, query, s, keyword). */
      searchTerms?: string;
    };
  };
  visit: {
    /** 1 for the first ever visit. */
    number: number;
    returning: boolean;
    sessionSeconds: number;
    pageviews: number;
  };
  device: {
    type: "mobile" | "tablet" | "desktop";
    viewport: { w: number; h: number };
    touch: boolean;
    language: string;
    timezone?: string;
  };
  scroll: {
    /** Deepest point reached on this page, 0..1. */
    maxDepth: number;
    current: number;
  };
  sections: SectionStat[];
  /** Most recent actions, oldest first. */
  actions: Action[];
  cursor: {
    /** Total ms with no interaction. */
    idleMs: number;
    hesitations: number;
    rageClicks: number;
    exitIntents: number;
    /** Copies of code/text made on this page. */
    copies: number;
  };
  /** Developer-supplied context (e.g. logged-in plan, A/B bucket). */
  context?: Record<string, string | number | boolean | null>;
}

export interface IntentRequest {
  snapshot: Snapshot;
  /** When true the evaluator echoes the raw model exchange back in `debug`. */
  debug?: boolean;
  /** Optional project key for the hosted API. Not needed when self-hosting. */
  projectKey?: string;
}

export interface IntentDebug {
  /** The exact `state` payload sent to the model. */
  state: unknown;
  /** The exact questions sent to the model. */
  questions: Record<string, unknown>;
  /** The raw answers from the model, untouched. */
  answers: Record<string, unknown>;
  provider: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface IntentResponse {
  state: VisitorState;
  debug?: IntentDebug;
}

export interface IntentFlagsOptions {
  /** Where snapshots are POSTed. Default `/api/intent`. */
  endpoint?: string;
  /** Optional key for the hosted IntentFlags API. */
  projectKey?: string;
  /** Ask the server to return the raw model exchange. Default false. */
  debug?: boolean;
  /** Minimum ms between two evaluations. Default 4000. */
  minIntervalMs?: number;
  /** Ms of quiet after the last event before evaluating. Default 2000. */
  debounceMs?: number;
  /** Re-evaluate at least this often while the visitor is active. Default 20000. */
  heartbeatMs?: number;
  /** Delay before the first evaluation after load. Default 1500. */
  initialDelayMs?: number;
  /** Max actions kept in a snapshot. Default 60. */
  maxActions?: number;
  /** Hover longer than this on a semantic element emits a `hover` action. Default 900. */
  hoverThresholdMs?: number;
  /** Developer-supplied context merged into every snapshot. */
  context?: Record<string, string | number | boolean | null>;
  /** CSS selector for sections. Default `[data-section], section[id], main > [id]`. */
  sectionSelector?: string;
  /** Disable all network calls (SSR, tests, consent not given). */
  disabled?: boolean;
  /** Restore the last state of this session from sessionStorage. Default true. */
  persist?: boolean;
  /** Custom fetch, for tests or exotic runtimes. */
  fetch?: typeof fetch;
  /** Called with every evaluated state. */
  onState?: (state: VisitorState, response: IntentResponse) => void;
  /** Called with every collected action. */
  onAction?: (action: Action) => void;
  /** Called when an evaluation fails. */
  onError?: (error: unknown) => void;
}

export type Unsubscribe = () => void;

export interface IntentFlagsClient {
  /** Current state. Never null: starts as an `initial` uniform state. */
  getState(): VisitorState;
  /** Latest full response including debug payload when requested. */
  getLastResponse(): IntentResponse | null;
  /** Actions collected so far in this page. */
  getActions(): Action[];
  /** Build the snapshot that would be sent right now. */
  getSnapshot(): Snapshot;
  subscribe(listener: (state: VisitorState) => void): Unsubscribe;
  subscribeActions(listener: (action: Action) => void): Unsubscribe;
  /** Record a custom semantic event, e.g. `track("opened_pricing_calculator")`. */
  track(target: string, detail?: string): void;
  /** Force an evaluation now (respects `minIntervalMs` unless `force`). */
  evaluate(force?: boolean): Promise<VisitorState>;
  /** Merge developer context into future snapshots. */
  setContext(context: Record<string, string | number | boolean | null>): void;
  /** Whether an evaluation is currently in flight. */
  isEvaluating(): boolean;
  /** Stop listening and cancel timers. */
  destroy(): void;
}
