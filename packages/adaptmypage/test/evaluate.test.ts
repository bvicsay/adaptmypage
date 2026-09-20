import { describe, expect, it } from "vitest";
import { DEFAULT_QUESTIONS, toVisitorState, createEvaluator, buildModelState } from "../src/server";
import type { RawResult } from "../src/server";
import { snapshot } from "./heuristic.test";

const jevLike: RawResult = {
  model: "jev-1.13.0",
  answers: {
    intent: {
      type: "choice",
      choice: "technical_evaluation",
      confidence: 0.91,
      probabilities: { exploring: 0.04, technical_evaluation: 0.91, price_comparison: 0.02, ready_to_buy: 0.02, seeking_support: 0.005, insufficient_signal: 0.005 },
    },
    next_action: {
      type: "choice",
      choice: "read_docs",
      confidence: 0.76,
      probabilities: { read_docs: 0.76, view_pricing: 0.1, sign_up: 0.05, check_integrations: 0.05, review_security: 0.02, contact: 0.01, leave: 0.01 },
    },
    expertise: { type: "score", score: 3.44, confidence: 0.6, probabilities: { "0": 0, "1": 0.02, "2": 0.1, "3": 0.3, "4": 0.58 } },
    friction: { type: "score", score: 0.54, confidence: 0.5, probabilities: { "0": 0.5, "1": 0.46, "2": 0.04, "3": 0 } },
    purchase_intent: { type: "score", score: 2.44, confidence: 0.4, probabilities: { "0": 0, "1": 0.1, "2": 0.4, "3": 0.46, "4": 0.04 } },
    abandon_risk: { type: "noul", noul: 0.12 },
  },
  usage: { input_tokens: 275, output_tokens: 20 },
};

describe("toVisitorState", () => {
  it("normalizes Jev answers into 0..1 fields and flags", () => {
    const s = toVisitorState(jevLike, DEFAULT_QUESTIONS, { source: "jev", latencyMs: 140 });
    expect(s.intent.value).toBe("technical_evaluation");
    expect(s.intent.confidence).toBe(0.91);
    expect(s.expertise).toBeCloseTo(3.44 / 4, 3);
    expect(s.friction).toBeCloseTo(0.54 / 3, 3);
    expect(s.purchaseIntent).toBeCloseTo(2.44 / 4, 3);
    expect(s.abandonRisk).toBe(0.12);
    expect(s.flags["next:read_docs"]).toBe(0.76);
    expect(s.flags.abandon_risk).toBe(0.12);
    expect(s.meta.model).toBe("jev-1.13.0");
    expect(s.meta.inputTokens).toBe(275);
    expect(s.meta.costUsd).toBeCloseTo(275 * 0.042e-6, 10);
  });

  it("fills missing options with zero and tolerates unknown choices", () => {
    const raw: RawResult = {
      model: "x",
      answers: {
        intent: { type: "choice", choice: "made_up", confidence: 0.9, probabilities: { exploring: 0.7, made_up: 0.3 } },
      },
    };
    const s = toVisitorState(raw, DEFAULT_QUESTIONS, { source: "jev", latencyMs: 0 });
    expect(s.intent.value).toBe("exploring");
    expect(s.intent.probabilities.ready_to_buy).toBe(0);
    expect(s.expertise).toBe(0.5); // missing score → neutral
  });

  it("exposes custom questions as flags", () => {
    const questions = {
      ...DEFAULT_QUESTIONS,
      wants_enterprise: { type: "noul" as const, instructions: "Enterprise buyer?" },
      persona: { type: "choice" as const, instructions: "Who?", criteria: { founder: "x", engineer: "y" } },
    };
    const raw: RawResult = {
      model: "x",
      answers: {
        ...jevLike.answers,
        wants_enterprise: { type: "noul", noul: 0.8 },
        persona: { type: "choice", choice: "engineer", confidence: 0.7, probabilities: { founder: 0.3, engineer: 0.7 } },
      },
    };
    const s = toVisitorState(raw, questions, { source: "jev", latencyMs: 0 });
    expect(s.flags.wants_enterprise).toBe(0.8);
    expect(s.flags["persona:engineer"]).toBe(0.7);
    expect(s.flags.persona).toBe(0.7);
  });
});

describe("createEvaluator", () => {
  it("uses a custom evaluator and returns debug info when asked", async () => {
    let seen: unknown = null;
    const evaluate = createEvaluator({
      siteContext: "Test site",
      provider: {
        kind: "custom",
        evaluate: async (state) => {
          seen = state;
          return jevLike;
        },
      },
    });
    const res = await evaluate(snapshot(), { debug: true });
    expect(res.state.meta.source).toBe("jev");
    expect(res.debug?.provider).toBe("custom");
    expect(res.debug?.usage?.inputTokens).toBe(275);
    expect((seen as { site: string }).site).toBe("Test site");
  });

  it("falls back to the heuristic when the model call fails", async () => {
    const evaluate = createEvaluator({
      provider: { kind: "custom", evaluate: async () => { throw new Error("boom"); } },
    });
    const res = await evaluate(snapshot(), { debug: true });
    expect(res.state.meta.source).toBe("heuristic");
    expect(res.debug?.provider).toContain("fallback");
  });

  it("uses the heuristic when no key is configured", async () => {
    const evaluate = createEvaluator({ provider: { kind: "heuristic" } });
    const res = await evaluate(snapshot());
    expect(res.state.meta.source).toBe("heuristic");
    expect(res.state.meta.model).toBe("heuristic-v1");
  });
});

describe("resolveProvider", () => {
  it("prefers TypeSafe, then Vercel gateway, then OpenRouter, then heuristic", async () => {
    const { resolveProvider, providerName } = await import("../src/server");
    const saved = { ...process.env };
    delete process.env.TYPESAFE_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    expect(resolveProvider().kind).toBe("heuristic");
    process.env.OPENROUTER_API_KEY = "sk-or-test";
    expect(providerName(resolveProvider())).toBe("openrouter:jev-latest");
    process.env.AI_GATEWAY_API_KEY = "vck-test";
    expect(resolveProvider().kind).toBe("vercel-gateway");
    process.env.TYPESAFE_API_KEY = "ts-test";
    expect(resolveProvider().kind).toBe("typesafe");
    process.env = saved;
  });

  it("sends the TypeSafe wire format to the resolved endpoint", async () => {
    const { createJevEvaluator } = await import("../src/server");
    let seen: { url: string; init: RequestInit } | null = null;
    const evaluate = createJevEvaluator({
      provider: { kind: "openrouter", apiKey: "sk-or-test" },
      fetch: (async (url: string, init?: RequestInit) => {
        seen = { url, init: init! };
        return new Response(JSON.stringify(jevLike), { status: 200 });
      }) as unknown as typeof fetch,
    });
    const res = await evaluate("state", DEFAULT_QUESTIONS);
    expect(res.model).toBe("jev-1.13.0");
    expect(seen!.url).toBe("https://openrouter.ai/api/v1/systemone");
    const body = JSON.parse(String(seen!.init.body));
    expect(body.model).toBe("jev-latest");
    expect(body.questions.abandon_risk.type).toBe("noul");
    expect((seen!.init.headers as Record<string, string>).authorization).toBe("Bearer sk-or-test");
  });
});

describe("buildModelState", () => {
  it("renders a compact, readable timeline", () => {
    const st = buildModelState(
      snapshot({
        page: { path: "/pricing", title: "Pricing", referrer: "https://www.google.com/", entry: { path: "/", referrer: "https://news.ycombinator.com/item?id=1", utm: { source: "hn" }, searchTerms: "intent feature flags" } },
        actions: [
          { t: 0, type: "pageview", target: "/" },
          { t: 12.5, type: "hover", target: "button:Compare plans", detail: "2.1s" },
        ],
      }),
      "IntentFlags landing page",
    );
    expect(st.site).toBe("IntentFlags landing page");
    expect(st.visitor.entry).toContain("news.ycombinator.com");
    expect(st.visitor.entry).toContain("utm source=hn");
    expect(st.timeline[1]).toBe("12.5s hover button:Compare plans (2.1s)");
  });
});
