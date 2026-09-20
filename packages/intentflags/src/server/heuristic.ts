import { DEFAULT_QUESTIONS, EXPERTISE_LEVELS, FRICTION_LEVELS, INTENT_IDS, NEXT_ACTION_IDS, PURCHASE_INTENT_LEVELS } from "../core/schema";
import type { Question } from "../core/schema";
import type { IntentId, NextActionId, Snapshot } from "../core/types";
import type { RawAnswer, RawResult } from "./jev";

const KW = {
  docs: /docs|api|reference|sdk|code|install|quickstart|integration|hook|example|develop/i,
  pricing: /pric|plan|tier|cost|billing|quota|limit|free|pro/i,
  security: /secur|privacy|gdpr|compliance|data/i,
  support: /faq|help|support|contact|question|trouble/i,
  cta: /sign ?up|get started|start building|start trial|start free|install|try it|join|subscribe|waitlist|early access|get updates|get the email|buy|checkout/i,
  integrations: /integration|next|react|framework|vue|svelte|compat/i,
};

/**
 * A transparent rules-based evaluator. It exists so the SDK works with no
 * API key (local dev, tests, CI) and its output is labelled `heuristic`.
 * It is intentionally simple; Jev replaces it in production.
 */
export function evaluateHeuristic(snapshot: Snapshot, questions: Record<string, Question> = DEFAULT_QUESTIONS): RawResult {
  const s = snapshot;
  const secs = s.visit.sessionSeconds;
  const dwell = (re: RegExp) =>
    s.sections.filter((x) => re.test(x.id) || re.test(x.label ?? "")).reduce((a, x) => a + x.viewedMs + x.hoverMs * 1.5, 0) / 1000;
  const acts = (pred: (a: Snapshot["actions"][number]) => boolean) => s.actions.filter(pred).length;
  const target = (re: RegExp) => acts((a) => !!a.target && re.test(a.target));

  const docsD = dwell(KW.docs);
  const priceD = dwell(KW.pricing);
  const secD = dwell(KW.security);
  const supD = dwell(KW.support);
  const intD = dwell(KW.integrations);
  const ctaHits = target(KW.cta) + acts((a) => a.type === "form_focus" || a.type === "form_input") * 2 + acts((a) => a.type === "form_submit") * 4;
  const copies = s.cursor.copies;
  const codeHover = acts((a) => a.type === "hover" && !!a.target && /^code:/.test(a.target));
  const total = s.actions.length;

  // intent
  const raw: Record<IntentId, number> = {
    insufficient_signal: Math.max(0.05, 3 - total * 0.35 - secs * 0.05),
    exploring: 0.8 + Math.min(2, total * 0.08) - (docsD + priceD) * 0.05,
    technical_evaluation: docsD * 0.25 + copies * 1.6 + codeHover * 0.6 + intD * 0.15 + secD * 0.1 + target(KW.docs) * 0.5,
    price_comparison: priceD * 0.35 + target(KW.pricing) * 0.8 + acts((a) => a.type === "scroll_return" && KW.pricing.test(a.target ?? "")) * 1.2,
    ready_to_buy: ctaHits * 0.9 + (s.visit.returning ? 0.8 : 0) + (docsD > 8 && priceD > 4 ? 1 : 0),
    seeking_support: supD * 0.35 + target(KW.support) * 0.9,
  };
  const intentP = softmax(capped(raw, 4.5), 1.6);
  const intent = argmax(intentP);

  // next action
  const nextRaw: Record<NextActionId, number> = {
    read_docs: 1 + (docsD < 5 ? 0.8 : 0.3) + (intent === "technical_evaluation" ? 0.8 : 0),
    view_pricing: 0.6 + (docsD > 6 && priceD < 3 ? 1.2 : 0) + (intent === "price_comparison" ? 0.8 : 0),
    sign_up: 0.3 + ctaHits * 0.5 + (intent === "ready_to_buy" ? 1.2 : 0),
    check_integrations: 0.4 + (intent === "technical_evaluation" && intD < 2 ? 0.7 : 0),
    review_security: 0.3 + (docsD > 10 && secD < 2 ? 0.6 : 0),
    contact: 0.2 + (intent === "seeking_support" ? 1 : 0),
    leave: 0.4 + s.cursor.exitIntents * 1.2 + (s.cursor.idleMs > 20000 ? 0.8 : 0) + (secs > 240 && ctaHits === 0 ? 0.5 : 0),
  };
  const nextP = softmax(capped(nextRaw, 4), 1.3);

  // scores (levels)
  const expertiseLevel = clamp(1.6 + copies * 0.8 + codeHover * 0.4 + (docsD > 10 ? 0.6 : 0) + (secD > 3 ? 0.5 : 0) - (supD > 5 ? 0.6 : 0), 0, EXPERTISE_LEVELS.length - 1);
  const frictionLevel = clamp(s.cursor.rageClicks * 1.2 + Math.min(1.2, s.cursor.hesitations * 0.3) + Math.min(0.9, acts((a) => a.type === "scroll_return") * 0.25) + (s.cursor.idleMs > 30000 ? 0.4 : 0), 0, FRICTION_LEVELS.length - 1);
  const purchaseLevel = clamp(Math.min(2.5, ctaHits * 0.6) + Math.min(1, priceD * 0.06) + (intent === "ready_to_buy" ? 0.8 : 0), 0, PURCHASE_INTENT_LEVELS.length - 1);
  const abandon = clamp(0.08 + s.cursor.exitIntents * 0.35 + (s.cursor.idleMs > 20000 ? 0.25 : 0) + (total < 3 && secs > 20 ? 0.2 : 0) - Math.min(0.3, total * 0.01) - ctaHits * 0.1, 0.02, 0.97);

  const answers: Record<string, RawAnswer> = {
    intent: { type: "choice", choice: intent, confidence: intentP[intent], probabilities: intentP },
    next_action: { type: "choice", choice: argmax(nextP), confidence: Math.max(...Object.values(nextP)), probabilities: nextP },
    expertise: scoreAnswer(expertiseLevel, EXPERTISE_LEVELS.length),
    friction: scoreAnswer(frictionLevel, FRICTION_LEVELS.length),
    purchase_intent: scoreAnswer(purchaseLevel, PURCHASE_INTENT_LEVELS.length),
    abandon_risk: { type: "noul", noul: round(abandon) },
  };

  // custom questions get a neutral answer so flags exist
  for (const [id, q] of Object.entries(questions)) {
    if (answers[id]) continue;
    if (q.type === "noul") answers[id] = { type: "noul", noul: 0.5 };
    else if (q.type === "choice") {
      const keys = Object.keys(q.criteria);
      const p = Object.fromEntries(keys.map((k) => [k, round(1 / keys.length)]));
      answers[id] = { type: "choice", choice: keys[0] ?? "", confidence: round(1 / keys.length), probabilities: p };
    } else answers[id] = scoreAnswer((q.criteria.length - 1) / 2, q.criteria.length);
  }

  return { model: "heuristic-v1", answers, usage: { input_tokens: 0, output_tokens: 0 } };
}

function scoreAnswer(level: number, n: number): RawAnswer {
  // spread probability mass around the fractional level
  const probs: Record<string, number> = {};
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(i - level);
    const p = Math.exp(-(d * d) / 0.45);
    probs[String(i)] = p;
    sum += p;
  }
  let score = 0;
  for (const k of Object.keys(probs)) {
    probs[k] = round(probs[k]! / sum);
    score += Number(k) * probs[k]!;
  }
  return { type: "score", score: round(score), confidence: round(Math.max(...Object.values(probs))), probabilities: probs };
}

function capped<T extends string>(raw: Record<T, number>, max: number): Record<T, number> {
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Math.min(max, v as number)])) as Record<T, number>;
}

function softmax<T extends string>(raw: Record<T, number>, temp: number): Record<T, number> {
  const keys = Object.keys(raw) as T[];
  const max = Math.max(...keys.map((k) => raw[k]));
  const exps = keys.map((k) => Math.exp((raw[k] - max) / temp));
  const sum = exps.reduce((a, b) => a + b, 0);
  return Object.fromEntries(keys.map((k, i) => [k, round(exps[i]! / sum)])) as Record<T, number>;
}

function argmax<T extends string>(p: Record<T, number>): T {
  return (Object.keys(p) as T[]).reduce((a, b) => (p[b] > p[a] ? b : a));
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round = (n: number) => Math.round(n * 1000) / 1000;

// keep the ids referenced so tree-shaking never drops the schema tables
void INTENT_IDS;
void NEXT_ACTION_IDS;
