import { initialState } from "adaptmypage";
import type { Action, IntentFlagsClient, IntentResponse, Snapshot, VisitorState } from "adaptmypage";
import type { Scenario } from "../types";

export interface ScenarioClient extends IntentFlagsClient {
  start(): void;
  /** 0..1 progress through the scripted steps. */
  progress(): number;
  isDone(): boolean;
}

/**
 * Replays a scripted visitor at a readable pace and asks the real API for a
 * judgment at checkpoints. Implements the SDK client interface so the demo page
 * uses the same hooks it would in production.
 */
export function createScenarioClient(
  scenario: Scenario,
  opts: { endpoint: string; path: string; stepMs?: number; onDone?: () => void },
): ScenarioClient {
  const stepMs = opts.stepMs ?? 950;
  let state: VisitorState = initialState();
  let lastResponse: IntentResponse | null = null;
  const actions: Action[] = [];
  const listeners = new Set<(s: VisitorState) => void>();
  const actionListeners = new Set<(a: Action) => void>();
  let i = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inflight: Promise<VisitorState> | null = null;
  let seq = 0;
  let destroyed = false;
  let done = false;
  const context: Record<string, string | number | boolean | null> = { scenario: scenario.id, persona: scenario.label };

  const total = scenario.steps.length;
  const lastT = scenario.steps[total - 1]?.t ?? 60;

  function snapshot(): Snapshot {
    const progress = total ? i / total : 1;
    const sessionSeconds = Math.max(1, Math.round(lastT * progress));
    const sections = Object.entries(scenario.sections).map(([id, s]) => ({
      id,
      ...(s.label ? { label: s.label } : {}),
      viewedMs: Math.round(s.viewedMs * progress),
      hoverMs: Math.round((s.hoverMs ?? 0) * progress),
      views: Math.max(1, Math.round((s.views ?? 1) * progress)),
    }));
    const count = (t: Action["type"]) => actions.filter((a) => a.type === t).length;
    return {
      v: 1,
      visitorId: `demo-${scenario.id}`,
      sessionId: `demo-${scenario.id}-${seq}`,
      sentAt: Date.now(),
      page: {
        path: opts.path,
        title: "",
        referrer: scenario.referrer ?? "",
        entry: {
          path: opts.path,
          referrer: scenario.referrer ?? "",
          utm: {},
          ...(scenario.searchTerms ? { searchTerms: scenario.searchTerms } : {}),
        },
      },
      visit: { number: scenario.returning ? 3 : 1, returning: !!scenario.returning, sessionSeconds, pageviews: 1 },
      device: {
        type: scenario.device ?? "desktop",
        viewport: scenario.device === "mobile" ? { w: 390, h: 844 } : { w: 1440, h: 900 },
        touch: scenario.device === "mobile",
        language: "en-US",
      },
      scroll: { maxDepth: Math.min(1, 0.2 + 0.8 * progress), current: Math.min(1, 0.2 + 0.8 * progress) },
      sections,
      actions: actions.slice(-60),
      cursor: {
        idleMs: count("idle") * 18000,
        hesitations: count("hesitation"),
        rageClicks: count("rage_click"),
        exitIntents: count("exit_intent"),
        copies: count("copy"),
      },
      context,
    };
  }

  function setState(s: VisitorState) {
    state = s;
    for (const l of listeners) l(s);
  }

  async function evaluate(): Promise<VisitorState> {
    if (destroyed) return state;
    if (inflight) return inflight;
    const mySeq = ++seq;
    const started = performance.now();
    inflight = (async () => {
      try {
        const res = await fetch(opts.endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ snapshot: snapshot(), debug: true }),
        });
        if (!res.ok) throw new Error(`intent ${res.status}`);
        const json = (await res.json()) as IntentResponse;
        if (destroyed || mySeq < seq) return state;
        const next: VisitorState = { ...json.state, meta: { ...json.state.meta, seq: mySeq, latencyMs: json.state.meta.latencyMs || Math.round(performance.now() - started) } };
        lastResponse = { ...json, state: next };
        setState(next);
        return next;
      } catch (err) {
        console.warn("[demo] evaluation failed", err);
        return state;
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  }

  function tick() {
    if (destroyed) return;
    const step = scenario.steps[i];
    if (!step) {
      done = true;
      void evaluate();
      opts.onDone?.();
      return;
    }
    i += 1;
    const action: Action = { t: step.t, type: step.type };
    if (step.target) action.target = step.target;
    if (step.detail) action.detail = step.detail;
    actions.push(action);
    for (const l of actionListeners) l(action);
    const strong = step.type === "click" || step.type === "copy" || step.type === "form_submit" || step.type === "exit_intent" || step.type === "rage_click";
    if (i % 3 === 0 || strong) void evaluate();
    const pause = step.type === "idle" ? stepMs * 1.6 : stepMs;
    timer = setTimeout(tick, pause);
  }

  return {
    start() {
      if (timer || done) return;
      timer = setTimeout(tick, 600);
    },
    progress: () => (total ? i / total : 1),
    isDone: () => done,
    getState: () => state,
    getLastResponse: () => lastResponse,
    getActions: () => actions.slice(),
    getSnapshot: snapshot,
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    subscribeActions(l) {
      actionListeners.add(l);
      return () => actionListeners.delete(l);
    },
    track(target, detail) {
      const a: Action = { t: lastT, type: "custom", target };
      if (detail) a.detail = detail;
      actions.push(a);
      for (const l of actionListeners) l(a);
    },
    evaluate: () => evaluate(),
    setContext(c) {
      Object.assign(context, c);
    },
    isEvaluating: () => inflight !== null,
    destroy() {
      destroyed = true;
      if (timer) clearTimeout(timer);
      listeners.clear();
      actionListeners.clear();
    },
  };
}
