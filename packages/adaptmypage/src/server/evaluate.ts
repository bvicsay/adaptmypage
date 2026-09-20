import { DEFAULT_QUESTIONS, INTENT_IDS, NEXT_ACTION_IDS, buildFlags } from "../core/schema";
import type { Question } from "../core/schema";
import type { IntentDebug, IntentId, IntentResponse, Judgment, NextActionId, Snapshot, VisitorState } from "../core/types";
import { evaluateHeuristic } from "./heuristic";
import { createJevEvaluator, providerName, resolveProvider, type Evaluator, type JevProvider, type RawAnswer, type RawResult } from "./jev";
import { buildModelState } from "./state";

/** Jev list price: $0.042 per million input tokens, output free. */
export const JEV_USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;

export interface EvaluateOptions {
  /** One or two sentences describing the site so judgments are grounded. */
  siteContext?: string;
  /** Extra questions merged over the defaults. Their answers show up in `state.flags`. */
  questions?: Record<string, Question>;
  provider?: JevProvider;
  timeoutMs?: number;
  retries?: number;
  fetch?: typeof fetch;
  /** Fall back to the heuristic evaluator when the model call fails. Default true. */
  fallbackOnError?: boolean;
}

const DEFAULT_SITE_CONTEXT =
  "A software product website. Sections are identified by id; timeline entries are semantic behavioral events with timestamps in seconds since the session began.";

/**
 * Evaluate a snapshot and return a normalized `VisitorState`.
 * Provider resolution: explicit option → TYPESAFE_API_KEY → AI_GATEWAY_API_KEY → heuristic.
 */
export function createEvaluator(options: EvaluateOptions = {}) {
  const provider = resolveProvider(options.provider);
  const questions: Record<string, Question> = { ...DEFAULT_QUESTIONS, ...(options.questions ?? {}) };
  const siteContext = options.siteContext ?? DEFAULT_SITE_CONTEXT;
  const fallbackOnError = options.fallbackOnError ?? true;

  let network: Evaluator | null = null;
  if (provider.kind !== "heuristic") {
    network = createJevEvaluator({ provider, timeoutMs: options.timeoutMs, retries: options.retries, fetch: options.fetch });
  }

  return async function evaluate(snapshot: Snapshot, opts: { debug?: boolean } = {}): Promise<IntentResponse> {
    const modelState = buildModelState(snapshot, siteContext);
    const started = Date.now();
    let raw: RawResult;
    let source: VisitorState["meta"]["source"] = "jev";
    let usedProvider = providerName(provider);

    if (network) {
      try {
        raw = await network(modelState, questions);
      } catch (err) {
        if (!fallbackOnError) throw err;
        raw = evaluateHeuristic(snapshot, questions);
        source = "heuristic";
        usedProvider = `heuristic (fallback: ${(err as Error)?.message ?? "error"})`;
      }
    } else {
      raw = evaluateHeuristic(snapshot, questions);
      source = "heuristic";
    }

    const latencyMs = Date.now() - started;
    const state = toVisitorState(raw, questions, { source, latencyMs });
    const response: IntentResponse = { state };
    if (opts.debug) {
      const debug: IntentDebug = { state: modelState, questions, answers: raw.answers, provider: usedProvider };
      if (raw.usage) debug.usage = { inputTokens: raw.usage.input_tokens, outputTokens: raw.usage.output_tokens };
      response.debug = debug;
    }
    return response;
  };
}

/** Map raw System One answers onto the typed VisitorState. Exported for tests and custom pipelines. */
export function toVisitorState(
  raw: RawResult,
  questions: Record<string, Question>,
  meta: { source: VisitorState["meta"]["source"]; latencyMs: number },
): VisitorState {
  const a = raw.answers;
  const intent = choiceJudgment<IntentId>(a.intent, INTENT_IDS, "insufficient_signal");
  const nextAction = choiceJudgment<NextActionId>(a.next_action, NEXT_ACTION_IDS, "read_docs");
  const expertise = scoreUnit(a.expertise, DEFAULT_QUESTIONS.expertise.criteria.length);
  const friction = scoreUnit(a.friction, DEFAULT_QUESTIONS.friction.criteria.length);
  const purchaseIntent = scoreUnit(a.purchase_intent, DEFAULT_QUESTIONS.purchase_intent.criteria.length);
  const abandonRisk = noulUnit(a.abandon_risk);

  const extra: Record<string, number> = {};
  for (const [id, q] of Object.entries(questions)) {
    if (id in DEFAULT_QUESTIONS) continue;
    const ans = a[id];
    if (!ans) continue;
    if (q.type === "noul") extra[id] = noulUnit(ans);
    else if (q.type === "score") extra[id] = scoreUnit(ans, q.criteria.length);
    else if (ans.type === "choice") {
      for (const [opt, p] of Object.entries(ans.probabilities)) extra[`${id}:${opt}`] = clamp01(p);
      extra[id] = clamp01(ans.confidence);
    }
  }

  const base = { intent, nextAction, expertise, friction, purchaseIntent, abandonRisk };
  const state: VisitorState = {
    ...base,
    flags: buildFlags({ ...base, meta: { source: meta.source, latencyMs: 0, evaluatedAt: 0, seq: 0 } }, extra),
    meta: {
      source: meta.source,
      model: raw.model,
      latencyMs: meta.latencyMs,
      evaluatedAt: Date.now(),
      seq: 0,
    },
  };
  if (raw.usage) {
    state.meta.inputTokens = raw.usage.input_tokens;
    // OpenRouter reports the billed cost; otherwise estimate from Jev's list price
    const cost = typeof raw.usage.cost === "number" ? raw.usage.cost : raw.usage.input_tokens * JEV_USD_PER_INPUT_TOKEN;
    state.meta.costUsd = Math.round(cost * 1e8) / 1e8;
  }
  return state;
}

function choiceJudgment<T extends string>(ans: RawAnswer | undefined, ids: readonly T[], fallback: T): Judgment<T> {
  const probabilities = {} as Record<T, number>;
  for (const id of ids) probabilities[id] = 0;
  if (ans && ans.type === "choice") {
    for (const [k, v] of Object.entries(ans.probabilities)) {
      if ((ids as readonly string[]).includes(k)) probabilities[k as T] = clamp01(v);
    }
    const value = (ids as readonly string[]).includes(ans.choice) ? (ans.choice as T) : argmax(probabilities, fallback);
    return { value, confidence: clamp01(probabilities[value] || ans.confidence || 0), probabilities };
  }
  const p = 1 / ids.length;
  for (const id of ids) probabilities[id] = p;
  return { value: fallback, confidence: p, probabilities };
}

function scoreUnit(ans: RawAnswer | undefined, levels: number): number {
  if (!ans || ans.type !== "score") return 0.5;
  const max = Math.max(1, levels - 1);
  return clamp01(ans.score / max);
}

function noulUnit(ans: RawAnswer | undefined): number {
  if (!ans || ans.type !== "noul") return 0.5;
  return clamp01(ans.noul);
}

function argmax<T extends string>(p: Record<T, number>, fallback: T): T {
  let best = fallback;
  let bestP = -1;
  for (const k of Object.keys(p) as T[]) {
    if (p[k] > bestP) {
      bestP = p[k];
      best = k;
    }
  }
  return best;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, Math.round(n * 1000) / 1000)) : 0);
