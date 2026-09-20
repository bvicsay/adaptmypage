import { Collector, STORAGE, deviceInfo, identity, safeStorage } from "./collector";
import { initialState } from "./schema";
import type {
  Action,
  IntentFlagsClient,
  IntentFlagsOptions,
  IntentResponse,
  Snapshot,
  Unsubscribe,
  VisitorState,
} from "./types";

const DEFAULTS = {
  endpoint: "/api/intent",
  minIntervalMs: 4000,
  debounceMs: 2000,
  heartbeatMs: 20000,
  initialDelayMs: 1500,
  maxActions: 60,
  hoverThresholdMs: 900,
  sectionSelector: "[data-section], section[id], main > [id]",
  persist: true,
} as const;

/**
 * Create an IntentFlags client. Safe to call during SSR: without a `window`
 * it returns an inert client that always reports the initial state.
 */
export function createIntentFlags(options: IntentFlagsOptions = {}): IntentFlagsClient {
  if (typeof window === "undefined" || options.disabled) return inertClient(options);
  return new BrowserClient(options);
}

class BrowserClient implements IntentFlagsClient {
  private o: Required<
    Pick<
      IntentFlagsOptions,
      | "endpoint"
      | "minIntervalMs"
      | "debounceMs"
      | "heartbeatMs"
      | "initialDelayMs"
      | "maxActions"
      | "hoverThresholdMs"
      | "sectionSelector"
      | "persist"
    >
  > &
    IntentFlagsOptions;
  private collector: Collector;
  private state: VisitorState;
  private lastResponse: IntentResponse | null = null;
  private listeners = new Set<(s: VisitorState) => void>();
  private actionListeners = new Set<(a: Action) => void>();
  private context: Record<string, string | number | boolean | null>;
  private id: ReturnType<typeof identity>;

  private seq = 0;
  private inflight: Promise<VisitorState> | null = null;
  private lastEvalAt = 0;
  private actionsSinceEval = 0;
  private quietHeartbeats = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private fetchImpl: typeof fetch;

  constructor(options: IntentFlagsOptions) {
    this.o = { ...DEFAULTS, ...options } as BrowserClient["o"];
    this.context = { ...(options.context ?? {}) };
    this.fetchImpl = options.fetch ?? ((...args) => fetch(...args));
    this.id = identity();
    this.state = this.restore() ?? initialState();

    this.collector = new Collector({
      sectionSelector: this.o.sectionSelector,
      hoverThresholdMs: this.o.hoverThresholdMs,
      maxActions: this.o.maxActions,
      onAction: (a) => this.onAction(a),
    });
    this.collector.start();
    this.collector.pageview("pageview");

    setTimeout(() => void this.evaluate(true), this.o.initialDelayMs);
    this.heartbeatTimer = setInterval(() => this.heartbeat(), this.o.heartbeatMs);
  }

  getState() {
    return this.state;
  }
  getLastResponse() {
    return this.lastResponse;
  }
  getActions() {
    return this.collector.getActions();
  }
  isEvaluating() {
    return this.inflight !== null;
  }

  subscribe(listener: (s: VisitorState) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeActions(listener: (a: Action) => void): Unsubscribe {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }

  track(target: string, detail?: string) {
    this.collector.record("custom", target, detail);
  }

  setContext(context: Record<string, string | number | boolean | null>) {
    Object.assign(this.context, context);
    this.schedule();
  }

  getSnapshot(): Snapshot {
    const ss = safeStorage("session");
    const pageviews = Number(ss?.getItem(STORAGE.pageviews) || "1");
    const snap: Snapshot = {
      v: 1,
      visitorId: this.id.visitorId,
      sessionId: this.id.sessionId,
      sentAt: Date.now(),
      page: {
        path: location.pathname,
        title: document.title.slice(0, 80),
        referrer: document.referrer || "",
        entry: this.id.entry,
      },
      visit: {
        number: this.id.visitNumber,
        returning: this.id.visitNumber > 1,
        sessionSeconds: this.collector.sessionSeconds(),
        pageviews,
      },
      device: deviceInfo(),
      scroll: this.collector.getScroll(),
      sections: this.collector.getSections(),
      actions: this.collector.getActions(),
      cursor: this.collector.getCursor(),
    };
    if (Object.keys(this.context).length) snap.context = { ...this.context };
    return snap;
  }

  async evaluate(force = false): Promise<VisitorState> {
    if (this.destroyed) return this.state;
    if (this.inflight) return this.inflight;
    const since = Date.now() - this.lastEvalAt;
    if (!force && since < this.o.minIntervalMs) {
      this.schedule(this.o.minIntervalMs - since);
      return this.state;
    }
    const seq = ++this.seq;
    const snapshot = this.getSnapshot();
    this.actionsSinceEval = 0;
    this.lastEvalAt = Date.now();
    const started = performance.now();

    this.inflight = (async () => {
      try {
        const body: Record<string, unknown> = { snapshot };
        if (this.o.debug) body.debug = true;
        if (this.o.projectKey) body.projectKey = this.o.projectKey;
        const res = await this.fetchImpl(this.o.endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          keepalive: true,
        });
        if (!res.ok) throw new Error(`adaptmypage: ${res.status} ${res.statusText}`);
        const json = (await res.json()) as IntentResponse;
        if (seq < this.seq - 1 || this.destroyed) return this.state; // stale
        const state: VisitorState = {
          ...json.state,
          meta: {
            ...json.state.meta,
            seq,
            latencyMs: json.state.meta.latencyMs || Math.round(performance.now() - started),
          },
        };
        this.lastResponse = { ...json, state };
        this.setState(state);
        this.o.onState?.(state, this.lastResponse);
        return state;
      } catch (err) {
        this.o.onError?.(err);
        return this.state;
      } finally {
        this.inflight = null;
      }
    })();
    return this.inflight;
  }

  destroy() {
    this.destroyed = true;
    this.collector.stop();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.listeners.clear();
    this.actionListeners.clear();
  }

  // --- internals -----------------------------------------------------------

  private onAction(a: Action) {
    this.actionsSinceEval += 1;
    this.quietHeartbeats = 0;
    for (const l of this.actionListeners) l(a);
    this.o.onAction?.(a);
    // strong signals evaluate sooner
    const urgent = a.type === "click" || a.type === "copy" || a.type === "form_submit" || a.type === "exit_intent" || a.type === "rage_click";
    if (a.type !== "tab_hidden") this.schedule(urgent ? Math.min(600, this.o.debounceMs) : undefined);
  }

  private schedule(delay = this.o.debounceMs) {
    if (this.destroyed) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      if (document.hidden) return;
      void this.evaluate();
    }, delay);
  }

  private heartbeat() {
    if (document.hidden || this.destroyed) return;
    if (this.actionsSinceEval === 0) {
      this.quietHeartbeats += 1;
      // dwell time is information, but a visitor idle for three beats is not worth re-judging
      if (this.quietHeartbeats > 2) return;
    }
    void this.evaluate();
  }

  private setState(state: VisitorState) {
    this.state = state;
    for (const l of this.listeners) l(state);
    if (this.o.persist) {
      try {
        safeStorage("session")?.setItem(STORAGE.state, JSON.stringify(state));
      } catch {
        /* ignore quota */
      }
    }
  }

  private restore(): VisitorState | null {
    if (!this.o.persist) return null;
    try {
      const raw = safeStorage("session")?.getItem(STORAGE.state);
      if (!raw) return null;
      const s = JSON.parse(raw) as VisitorState;
      if (!s?.intent?.probabilities) return null;
      return { ...s, meta: { ...s.meta, source: "cached", latencyMs: 0 } };
    } catch {
      return null;
    }
  }
}

function inertClient(options: IntentFlagsOptions): IntentFlagsClient {
  const state = initialState();
  const noop = () => () => {};
  return {
    getState: () => state,
    getLastResponse: () => null,
    getActions: () => [],
    getSnapshot: () => ({
      v: 1,
      visitorId: "ssr",
      sessionId: "ssr",
      sentAt: 0,
      page: { path: "/", title: "", referrer: "", entry: { path: "/", referrer: "", utm: {} } },
      visit: { number: 1, returning: false, sessionSeconds: 0, pageviews: 0 },
      device: { type: "desktop", viewport: { w: 0, h: 0 }, touch: false, language: "" },
      scroll: { maxDepth: 0, current: 0 },
      sections: [],
      actions: [],
      cursor: { idleMs: 0, hesitations: 0, rageClicks: 0, exitIntents: 0, copies: 0 },
      ...(options.context ? { context: options.context } : {}),
    }),
    subscribe: noop,
    subscribeActions: noop,
    track: () => {},
    evaluate: async () => state,
    setContext: () => {},
    isEvaluating: () => false,
    destroy: () => {},
  };
}
