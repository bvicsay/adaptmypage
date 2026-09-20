import { describe, expect, it } from "vitest";
import { evaluateHeuristic, toVisitorState, DEFAULT_QUESTIONS } from "../src/server";
import type { Snapshot } from "../src/core/types";

export function snapshot(partial: Partial<Snapshot> = {}): Snapshot {
  return {
    v: 1,
    visitorId: "v1",
    sessionId: "s1",
    sentAt: Date.now(),
    page: { path: "/", title: "IntentFlags", referrer: "", entry: { path: "/", referrer: "", utm: {} } },
    visit: { number: 1, returning: false, sessionSeconds: 30, pageviews: 1 },
    device: { type: "desktop", viewport: { w: 1440, h: 900 }, touch: false, language: "en" },
    scroll: { maxDepth: 0.4, current: 0.3 },
    sections: [],
    actions: [{ t: 0, type: "pageview", target: "/" }],
    cursor: { idleMs: 0, hesitations: 0, rageClicks: 0, exitIntents: 0, copies: 0 },
    ...partial,
  };
}

describe("evaluateHeuristic", () => {
  it("returns a full answer set with probabilities that sum to 1", () => {
    const res = evaluateHeuristic(snapshot());
    expect(Object.keys(res.answers).sort()).toEqual(Object.keys(DEFAULT_QUESTIONS).sort());
    const intent = res.answers.intent!;
    expect(intent.type).toBe("choice");
    if (intent.type === "choice") {
      const sum = Object.values(intent.probabilities).reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThan(0.98);
      expect(sum).toBeLessThan(1.02);
    }
  });

  it("reads documentation focus as technical evaluation", () => {
    const res = evaluateHeuristic(
      snapshot({
        visit: { number: 1, returning: false, sessionSeconds: 90, pageviews: 1 },
        sections: [
          { id: "docs", label: "API reference", viewedMs: 40000, hoverMs: 20000, views: 2 },
          { id: "hero", viewedMs: 3000, hoverMs: 0, views: 1 },
        ],
        cursor: { idleMs: 0, hesitations: 0, rageClicks: 0, exitIntents: 0, copies: 2 },
        actions: [
          { t: 0, type: "pageview", target: "/" },
          { t: 4, type: "section_enter", target: "docs" },
          { t: 9, type: "hover", target: "code:npm install adaptmypage", detail: "3.1s" },
          { t: 12, type: "copy", target: "code:npm install adaptmypage" },
          { t: 30, type: "copy", target: "code:useIntent" },
        ],
      }),
    );
    expect(res.answers.intent).toMatchObject({ type: "choice", choice: "technical_evaluation" });
    const state = toVisitorState(res, DEFAULT_QUESTIONS, { source: "heuristic", latencyMs: 1 });
    expect(state.expertise).toBeGreaterThan(0.5);
    expect(state.flags.technical_evaluation).toBe(state.intent.confidence);
  });

  it("reads pricing focus and returns as price comparison", () => {
    const res = evaluateHeuristic(
      snapshot({
        sections: [{ id: "pricing", label: "Pricing", viewedMs: 30000, hoverMs: 15000, views: 3 }],
        actions: [
          { t: 0, type: "pageview" },
          { t: 5, type: "section_enter", target: "pricing" },
          { t: 20, type: "scroll_return", target: "pricing", detail: "8s later" },
          { t: 22, type: "hover", target: "button:Compare plans", detail: "2.0s" },
        ],
      }),
    );
    expect(res.answers.intent).toMatchObject({ choice: "price_comparison" });
  });

  it("raises abandon risk on exit intent and idling", () => {
    const calm = toVisitorState(evaluateHeuristic(snapshot()), DEFAULT_QUESTIONS, { source: "heuristic", latencyMs: 0 });
    const risky = toVisitorState(
      evaluateHeuristic(snapshot({ cursor: { idleMs: 40000, hesitations: 0, rageClicks: 0, exitIntents: 2, copies: 0 } })),
      DEFAULT_QUESTIONS,
      { source: "heuristic", latencyMs: 0 },
    );
    expect(risky.abandonRisk).toBeGreaterThan(calm.abandonRisk);
    expect(risky.nextAction.probabilities.leave).toBeGreaterThan(calm.nextAction.probabilities.leave);
  });
});
