import type { Snapshot } from "../core/types";

export interface ModelState {
  site: string;
  visitor: {
    visit: string;
    device: string;
    entry: string;
    current_page: string;
    session_seconds: number;
    scroll_depth: string;
    idle_seconds: number;
    hesitations: number;
    rage_clicks: number;
    exit_intents: number;
    code_copies: number;
  };
  sections: string[];
  timeline: string[];
  context?: Record<string, string | number | boolean | null>;
}

/**
 * Turn a raw snapshot into the state object Jev reads. Compact, ordered,
 * human-readable lines: Jev judges sequences well and every token is billed.
 */
export function buildModelState(snapshot: Snapshot, siteContext: string): ModelState {
  const s = snapshot;
  const entryBits: string[] = [];
  if (s.page.entry.referrer) entryBits.push(`referrer ${hostOf(s.page.entry.referrer)}`);
  else entryBits.push("direct / no referrer");
  if (s.page.entry.searchTerms) entryBits.push(`search terms "${s.page.entry.searchTerms}"`);
  const utm = Object.entries(s.page.entry.utm);
  if (utm.length) entryBits.push(`utm ${utm.map(([k, v]) => `${k}=${v}`).join(" ")}`);
  entryBits.push(`landed on ${s.page.entry.path}`);

  const sections = s.sections
    .slice()
    .sort((a, b) => b.viewedMs + b.hoverMs - (a.viewedMs + a.hoverMs))
    .slice(0, 14)
    .map((sec) => {
      const parts = [`${sec.id}${sec.label ? ` ("${sec.label}")` : ""}`];
      parts.push(`in view ${(sec.viewedMs / 1000).toFixed(1)}s`);
      if (sec.hoverMs > 400) parts.push(`cursor on it ${(sec.hoverMs / 1000).toFixed(1)}s`);
      if (sec.views > 1) parts.push(`${sec.views} separate views`);
      return parts.join(", ");
    });

  const timeline = s.actions.map((a) => {
    const t = `${a.t.toFixed(1)}s`;
    const parts = [t, a.type.replace(/_/g, " ")];
    if (a.target) parts.push(a.target);
    if (a.detail) parts.push(`(${a.detail})`);
    return parts.join(" ");
  });

  const state: ModelState = {
    site: siteContext,
    visitor: {
      visit: s.visit.returning ? `returning visitor, visit #${s.visit.number}, ${s.visit.pageviews} pageviews this session` : `first visit, ${s.visit.pageviews} pageview${s.visit.pageviews === 1 ? "" : "s"} this session`,
      device: `${s.device.type}${s.device.touch ? " (touch)" : ""}, ${s.device.viewport.w}x${s.device.viewport.h}, ${s.device.language}`,
      entry: entryBits.join("; "),
      current_page: `${s.page.path}${s.page.title ? ` — ${s.page.title}` : ""}`,
      session_seconds: s.visit.sessionSeconds,
      scroll_depth: `max ${Math.round(s.scroll.maxDepth * 100)}%, now ${Math.round(s.scroll.current * 100)}%`,
      idle_seconds: Math.round(s.cursor.idleMs / 1000),
      hesitations: s.cursor.hesitations,
      rage_clicks: s.cursor.rageClicks,
      exit_intents: s.cursor.exitIntents,
      code_copies: s.cursor.copies,
    },
    sections,
    timeline,
  };
  if (s.context && Object.keys(s.context).length) state.context = s.context;
  return state;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.slice(0, 60);
  }
}
