import type { Action, SectionStat, Snapshot } from "./types";

export interface CollectorOptions {
  sectionSelector: string;
  hoverThresholdMs: number;
  maxActions: number;
  onAction: (action: Action) => void;
}

const INTERACTIVE =
  "a, button, [role='button'], input, select, textarea, summary, label, [data-intent]";
const HOVERABLE = `${INTERACTIVE}, pre, code, table, img, video, h1, h2, h3, [data-hover]`;
const SEARCH_PARAMS = ["q", "query", "s", "search", "keyword", "k"];

export const STORAGE = {
  visitorId: "if:vid",
  visits: "if:visits",
  sessionId: "if:sid",
  sessionStart: "if:ss",
  entry: "if:entry",
  pageviews: "if:pv",
  state: "if:state",
  visitCounted: "if:vc",
} as const;

export function safeStorage(kind: "local" | "session"): Storage | null {
  try {
    const s = kind === "local" ? window.localStorage : window.sessionStorage;
    const k = "__if_test__";
    s.setItem(k, "1");
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function text(el: Element, max = 48): string {
  const raw =
    el.getAttribute("data-intent") ||
    el.getAttribute("aria-label") ||
    (el as HTMLElement).innerText ||
    el.textContent ||
    el.getAttribute("title") ||
    el.getAttribute("alt") ||
    el.getAttribute("href") ||
    el.getAttribute("name") ||
    el.getAttribute("placeholder") ||
    "";
  const t = raw.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function labelOf(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const t = text(el);
  if (tag === "input" || tag === "textarea" || tag === "select") {
    const input = el as HTMLInputElement;
    const name = input.name || input.id || input.placeholder || input.type;
    return `${tag}:${name}`;
  }
  if (tag === "pre" || tag === "code") return `code:${t}`;
  if (tag === "a") return `link:${t || (el as HTMLAnchorElement).getAttribute("href") || ""}`;
  if (tag === "button" || el.getAttribute("role") === "button") return `button:${t}`;
  if (/^h[1-3]$/.test(tag)) return `heading:${t}`;
  return `${tag}:${t}`;
}

/**
 * Collects semantic behavioral events from the DOM.
 * It never records coordinates, keystrokes or field values.
 */
export class Collector {
  private opts: CollectorOptions;
  private actions: Action[] = [];
  private sections = new Map<string, SectionStat>();
  private sectionEls = new Map<Element, string>();
  private sectionEnteredAt = new Map<string, number>();
  private sectionLastExit = new Map<string, number>();
  private observer: IntersectionObserver | null = null;
  private mutation: MutationObserver | null = null;
  private disposers: Array<() => void> = [];
  private rescanTimer: ReturnType<typeof setTimeout> | null = null;

  private sessionStartMs: number;
  private lastInteraction = Date.now();
  private idle = false;
  private idleSince = 0;
  private idleMs = 0;
  private idleTimer: ReturnType<typeof setInterval> | null = null;

  private hoverEl: Element | null = null;
  private hoverSince = 0;
  private hoverSectionId: string | null = null;
  private hoverSectionSince = 0;
  private hesitated = false;
  private lastMoveAt = 0;
  private lastMoveY = 0;
  private lastExitIntent = 0;

  private clicks: Array<{ t: number; target: string }> = [];
  private scrollMilestones = new Set<number>();
  private maxDepth = 0;
  private currentDepth = 0;
  private inputTouched = new Set<string>();
  private selectionTimer: ReturnType<typeof setTimeout> | null = null;

  hesitations = 0;
  rageClicks = 0;
  exitIntents = 0;
  copies = 0;

  constructor(opts: CollectorOptions) {
    this.opts = opts;
    const ss = safeStorage("session");
    const stored = ss?.getItem(STORAGE.sessionStart);
    this.sessionStartMs = stored ? Number(stored) : Date.now();
    if (!stored) ss?.setItem(STORAGE.sessionStart, String(this.sessionStartMs));
  }

  /** Seconds since session start, one decimal. */
  now(): number {
    return Math.round((Date.now() - this.sessionStartMs) / 100) / 10;
  }

  sessionSeconds(): number {
    return Math.round((Date.now() - this.sessionStartMs) / 1000);
  }

  start(): void {
    if (typeof window === "undefined") return;
    this.scanSections();
    this.mutation = new MutationObserver(() => this.scheduleRescan());
    this.mutation.observe(document.body, { childList: true, subtree: true });

    this.on(document, "click", this.onClick as EventListener, true);
    this.on(document, "mousemove", this.onMove as EventListener, { passive: true });
    this.on(document, "mouseleave", this.onLeave as EventListener);
    this.on(window, "scroll", this.onScroll as EventListener, { passive: true });
    this.on(document, "copy", this.onCopy as EventListener);
    this.on(document, "selectionchange", this.onSelection as EventListener);
    this.on(document, "focusin", this.onFocusIn as EventListener);
    this.on(document, "input", this.onInput as EventListener, true);
    this.on(document, "submit", this.onSubmit as EventListener, true);
    this.on(document, "visibilitychange", this.onVisibility as EventListener);
    this.on(window, "popstate", () => this.pageview("navigate"));
    this.on(document, "keydown", this.touch as EventListener, { passive: true });
    this.on(document, "touchstart", this.touch as EventListener, { passive: true });
    this.on(document, "pointerdown", this.touch as EventListener, { passive: true });

    this.patchHistory();
    this.idleTimer = setInterval(this.tickIdle, 1000);
    this.onScroll();
  }

  stop(): void {
    this.observer?.disconnect();
    this.mutation?.disconnect();
    for (const d of this.disposers) d();
    this.disposers = [];
    if (this.idleTimer) clearInterval(this.idleTimer);
    if (this.rescanTimer) clearTimeout(this.rescanTimer);
    if (this.selectionTimer) clearTimeout(this.selectionTimer);
  }

  getActions(): Action[] {
    return this.actions.slice();
  }

  getSections(): SectionStat[] {
    const now = Date.now();
    return Array.from(this.sections.values())
      .map((s) => {
        const enteredAt = this.sectionEnteredAt.get(s.id);
        const liveHover = this.hoverSectionId === s.id ? now - this.hoverSectionSince : 0;
        return {
          ...s,
          viewedMs: s.viewedMs + (enteredAt ? now - enteredAt : 0),
          hoverMs: s.hoverMs + liveHover,
        };
      })
      .filter((s) => s.views > 0 || s.hoverMs > 0);
  }

  getScroll(): Snapshot["scroll"] {
    return { maxDepth: round2(this.maxDepth), current: round2(this.currentDepth) };
  }

  getCursor(): Snapshot["cursor"] {
    const liveIdle = this.idle ? Date.now() - this.idleSince : 0;
    return {
      idleMs: this.idleMs + liveIdle,
      hesitations: this.hesitations,
      rageClicks: this.rageClicks,
      exitIntents: this.exitIntents,
      copies: this.copies,
    };
  }

  /** Record a semantic event. Public so developers can `track()` custom ones. */
  record(type: Action["type"], target?: string, detail?: string): Action {
    const action: Action = { t: this.now(), type };
    if (target) action.target = target;
    if (detail) action.detail = detail;
    this.actions.push(action);
    if (this.actions.length > this.opts.maxActions) {
      this.actions.splice(0, this.actions.length - this.opts.maxActions);
    }
    this.opts.onAction(action);
    return action;
  }

  pageview(type: "pageview" | "navigate" = "pageview"): void {
    const ss = safeStorage("session");
    const pv = Number(ss?.getItem(STORAGE.pageviews) || "0") + 1;
    ss?.setItem(STORAGE.pageviews, String(pv));
    this.scrollMilestones.clear();
    this.maxDepth = 0;
    this.record(type, location.pathname + location.search, document.title.slice(0, 60));
    this.scheduleRescan();
  }

  /** Re-scan the DOM for sections (call after big layout changes). */
  scanSections(): void {
    if (typeof IntersectionObserver === "undefined") return;
    if (!this.observer) {
      this.observer = new IntersectionObserver(this.onIntersect, { threshold: [0, 0.25] });
    }
    const els = document.querySelectorAll(this.opts.sectionSelector);
    const seen = new Set<Element>();
    els.forEach((el) => {
      seen.add(el);
      if (this.sectionEls.has(el)) return;
      const id = el.getAttribute("data-section") || el.id;
      if (!id) return;
      this.sectionEls.set(el, id);
      if (!this.sections.has(id)) {
        const heading = el.querySelector("h1, h2, h3");
        const stat: SectionStat = { id, viewedMs: 0, hoverMs: 0, views: 0 };
        const label = el.getAttribute("data-section-label") || (heading ? text(heading, 40) : "");
        if (label) stat.label = label;
        this.sections.set(id, stat);
      }
      this.observer!.observe(el);
    });
    for (const [el] of this.sectionEls) {
      if (!seen.has(el)) {
        this.observer.unobserve(el);
        this.sectionEls.delete(el);
      }
    }
  }

  // --- internals -----------------------------------------------------------

  private on<K extends keyof DocumentEventMap>(
    target: Document | Window,
    type: K | string,
    handler: EventListener,
    opts?: boolean | AddEventListenerOptions,
  ) {
    target.addEventListener(type, handler, opts);
    this.disposers.push(() => target.removeEventListener(type, handler, opts));
  }

  private scheduleRescan() {
    if (this.rescanTimer) clearTimeout(this.rescanTimer);
    this.rescanTimer = setTimeout(() => this.scanSections(), 400);
  }

  private patchHistory() {
    const h = window.history;
    const push = h.pushState;
    const replace = h.replaceState;
    let last = location.pathname;
    const check = () => {
      if (location.pathname !== last) {
        last = location.pathname;
        this.pageview("navigate");
      }
    };
    h.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
      push.apply(this, args);
      check();
    };
    h.replaceState = function (this: History, ...args: Parameters<History["replaceState"]>) {
      replace.apply(this, args);
      check();
    };
    this.disposers.push(() => {
      h.pushState = push;
      h.replaceState = replace;
    });
  }

  private sectionOf(el: Element | null): string | null {
    let cur: Element | null = el;
    while (cur) {
      const id = this.sectionEls.get(cur);
      if (id) return id;
      cur = cur.parentElement;
    }
    return null;
  }

  private touch = () => {
    this.lastInteraction = Date.now();
    if (this.idle) {
      this.idle = false;
      this.idleMs += Date.now() - this.idleSince;
      this.record("resume", undefined, `${Math.round((Date.now() - this.idleSince) / 1000)}s idle`);
    }
  };

  private tickIdle = () => {
    if (this.idle || document.hidden) return;
    if (Date.now() - this.lastInteraction > 15000) {
      this.idle = true;
      this.idleSince = Date.now();
      this.record("idle", this.hoverSectionId || undefined);
    }
  };

  private onIntersect = (entries: IntersectionObserverEntry[]) => {
    const now = Date.now();
    for (const e of entries) {
      const id = this.sectionEls.get(e.target);
      if (!id) continue;
      const stat = this.sections.get(id);
      if (!stat) continue;
      const visible = e.isIntersecting && e.intersectionRatio >= 0.25;
      if (visible && !this.sectionEnteredAt.has(id)) {
        this.sectionEnteredAt.set(id, now);
        stat.views += 1;
        const lastExit = this.sectionLastExit.get(id);
        if (lastExit && stat.viewedMs > 2000) {
          this.record("scroll_return", id, `${Math.round((now - lastExit) / 1000)}s later`);
        } else {
          this.record("section_enter", id);
        }
      } else if (!visible && this.sectionEnteredAt.has(id)) {
        const enteredAt = this.sectionEnteredAt.get(id)!;
        this.sectionEnteredAt.delete(id);
        const dwell = now - enteredAt;
        stat.viewedMs += dwell;
        this.sectionLastExit.set(id, now);
        if (dwell >= 1200) this.record("section_exit", id, `${(dwell / 1000).toFixed(1)}s`);
      }
    }
  };

  private onClick = (ev: MouseEvent) => {
    this.touch();
    const el = (ev.target as Element | null)?.closest?.(INTERACTIVE) ?? (ev.target as Element | null);
    if (!el) return;
    const target = labelOf(el);
    const section = this.sectionOf(el);
    const now = Date.now();
    this.clicks.push({ t: now, target });
    this.clicks = this.clicks.filter((c) => now - c.t < 700);
    if (this.clicks.filter((c) => c.target === target).length >= 3) {
      this.rageClicks += 1;
      this.clicks = [];
      this.record("rage_click", target, section || undefined);
      return;
    }
    this.hesitated = true; // a click resolves any hesitation on this element
    this.record("click", target, section || undefined);
  };

  private onMove = (ev: MouseEvent) => {
    const now = Date.now();
    this.touch();
    // exit intent: fast upward movement leaving through the top edge
    if (ev.clientY <= 8 && this.lastMoveY - ev.clientY > 12 && now - this.lastExitIntent > 10000) {
      this.lastExitIntent = now;
      this.exitIntents += 1;
      this.record("exit_intent", this.hoverSectionId || undefined);
    }
    this.lastMoveY = ev.clientY;
    if (now - this.lastMoveAt < 80) return; // throttle element lookups
    this.lastMoveAt = now;

    const raw = ev.target as Element | null;
    const el = raw?.closest?.(HOVERABLE) ?? null;
    const sectionId = this.sectionOf(raw);

    if (sectionId !== this.hoverSectionId) {
      if (this.hoverSectionId) {
        const stat = this.sections.get(this.hoverSectionId);
        if (stat) stat.hoverMs += now - this.hoverSectionSince;
      }
      this.hoverSectionId = sectionId;
      this.hoverSectionSince = now;
    }

    if (el !== this.hoverEl) {
      this.flushHover(now);
      this.hoverEl = el;
      this.hoverSince = now;
      this.hesitated = false;
    } else if (el && !this.hesitated && now - this.hoverSince > 2500 && el.matches(INTERACTIVE)) {
      this.hesitated = true;
      this.hesitations += 1;
      this.record("hesitation", labelOf(el), sectionId || undefined);
    }
  };

  private flushHover(now: number) {
    if (this.hoverEl && now - this.hoverSince >= this.opts.hoverThresholdMs) {
      const dur = now - this.hoverSince;
      this.record("hover", labelOf(this.hoverEl), `${(dur / 1000).toFixed(1)}s`);
    }
  }

  private onLeave = () => {
    this.flushHover(Date.now());
    this.hoverEl = null;
  };

  private onScroll = () => {
    this.touch();
    const doc = document.documentElement;
    const total = Math.max(1, doc.scrollHeight - window.innerHeight);
    const depth = Math.min(1, Math.max(0, window.scrollY / total));
    this.currentDepth = depth;
    if (depth > this.maxDepth) this.maxDepth = depth;
    for (const m of [0.25, 0.5, 0.75, 1]) {
      if (depth >= m - 0.01 && !this.scrollMilestones.has(m)) {
        this.scrollMilestones.add(m);
        this.record("scroll", undefined, `${Math.round(m * 100)}%`);
      }
    }
  };

  private onCopy = (ev: ClipboardEvent) => {
    this.copies += 1;
    const sel = document.getSelection()?.toString().replace(/\s+/g, " ").trim() ?? "";
    const el = (ev.target as Element | null)?.closest?.("pre, code, [data-section]") ?? null;
    const target = el ? labelOf(el) : this.hoverSectionId || undefined;
    this.record("copy", target, sel ? `"${sel.slice(0, 60)}"` : undefined);
  };

  private onSelection = () => {
    if (this.selectionTimer) clearTimeout(this.selectionTimer);
    this.selectionTimer = setTimeout(() => {
      const sel = document.getSelection();
      const str = sel?.toString().trim() ?? "";
      if (str.length < 20) return;
      const anchor = sel?.anchorNode?.parentElement ?? null;
      this.record("select_text", this.sectionOf(anchor) || undefined, `${str.length} chars`);
    }, 600);
  };

  private onFocusIn = (ev: FocusEvent) => {
    const el = ev.target as Element | null;
    if (!el?.matches?.("input, textarea, select")) return;
    this.record("form_focus", labelOf(el), this.sectionOf(el) || undefined);
  };

  private onInput = (ev: Event) => {
    const el = ev.target as Element | null;
    if (!el?.matches?.("input, textarea, select")) return;
    const label = labelOf(el);
    if (this.inputTouched.has(label)) return;
    this.inputTouched.add(label);
    this.record("form_input", label);
  };

  private onSubmit = (ev: Event) => {
    const form = ev.target as HTMLFormElement | null;
    const name = form?.getAttribute("data-intent") || form?.getAttribute("name") || form?.id || "form";
    this.record("form_submit", name, this.sectionOf(form) || undefined);
  };

  private onVisibility = () => {
    if (document.hidden) {
      this.flushHover(Date.now());
      this.record("tab_hidden");
    } else {
      this.touch();
      this.record("tab_visible");
    }
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Read or initialise the per-visitor / per-session identity and entry info. */
export function identity(): {
  visitorId: string;
  sessionId: string;
  visitNumber: number;
  pageviews: number;
  entry: Snapshot["page"]["entry"];
} {
  const ls = safeStorage("local");
  const ss = safeStorage("session");

  let visitorId = ls?.getItem(STORAGE.visitorId) ?? null;
  if (!visitorId) {
    visitorId = uid();
    ls?.setItem(STORAGE.visitorId, visitorId);
  }
  let sessionId = ss?.getItem(STORAGE.sessionId) ?? null;
  if (!sessionId) {
    sessionId = uid();
    ss?.setItem(STORAGE.sessionId, sessionId);
  }
  let visitNumber = Number(ls?.getItem(STORAGE.visits) || "0");
  if (!ss?.getItem(STORAGE.visitCounted)) {
    visitNumber += 1;
    ls?.setItem(STORAGE.visits, String(visitNumber));
    ss?.setItem(STORAGE.visitCounted, "1");
  }
  if (visitNumber === 0) visitNumber = 1;

  let entry: Snapshot["page"]["entry"] | null = null;
  const storedEntry = ss?.getItem(STORAGE.entry);
  if (storedEntry) {
    try {
      entry = JSON.parse(storedEntry);
    } catch {
      entry = null;
    }
  }
  if (!entry) {
    const params = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    let searchTerms: string | undefined;
    params.forEach((v, k) => {
      if (k.startsWith("utm_")) utm[k.slice(4)] = v.slice(0, 80);
      if (SEARCH_PARAMS.includes(k) && v) searchTerms = v.slice(0, 120);
    });
    const ref = document.referrer || "";
    entry = { path: location.pathname, referrer: ref, utm };
    if (searchTerms) entry.searchTerms = searchTerms;
    ss?.setItem(STORAGE.entry, JSON.stringify(entry));
  }
  const pageviews = Number(ss?.getItem(STORAGE.pageviews) || "0");
  return { visitorId, sessionId, visitNumber, pageviews, entry };
}

export function deviceInfo(): Snapshot["device"] {
  const w = window.innerWidth;
  const type = w < 768 ? "mobile" : w < 1100 ? "tablet" : "desktop";
  let timezone: string | undefined;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timezone = undefined;
  }
  const info: Snapshot["device"] = {
    type,
    viewport: { w, h: window.innerHeight },
    touch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    language: navigator.language,
  };
  if (timezone) info.timezone = timezone;
  return info;
}
