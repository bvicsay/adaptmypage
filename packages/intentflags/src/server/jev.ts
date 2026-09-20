import type { Question } from "../core/schema";

/** Raw answer shapes as returned by TypeSafe's System One API (`POST /v1/systemone`). */
export type RawChoiceAnswer = {
  type: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};
export type RawScoreAnswer = {
  type: "score";
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
  legend?: Record<string, unknown>;
};
export type RawNoulAnswer = { type: "noul"; noul: number };
export type RawAnswer = RawChoiceAnswer | RawScoreAnswer | RawNoulAnswer;

export interface RawResult {
  model: string;
  answers: Record<string, RawAnswer>;
  usage?: { input_tokens: number; output_tokens: number; cost?: number };
}

export type Evaluator = (state: unknown, questions: Record<string, Question>) => Promise<RawResult>;

export type JevProvider =
  | {
      /** Call TypeSafe directly. Uses `TYPESAFE_API_KEY` when `apiKey` is omitted. */
      kind: "typesafe";
      apiKey?: string;
      /** Default `https://api.typesafe.ai`. */
      baseURL?: string;
      /** Default `jev-latest`. */
      model?: string;
    }
  | {
      /** Route through Vercel AI Gateway's TypeSafe-compatible endpoint. Uses `AI_GATEWAY_API_KEY`. */
      kind: "vercel-gateway";
      apiKey?: string;
      /** Default `typesafe-ai/jev`. */
      model?: string;
    }
  | {
      /** Route through OpenRouter's Decisions API (TypeSafe-compatible). Uses `OPENROUTER_API_KEY`. */
      kind: "openrouter";
      apiKey?: string;
      /** Default `jev-latest`. */
      model?: string;
    }
  | {
      /** Deterministic rules. No network. Used automatically when no key is configured. */
      kind: "heuristic";
    }
  | {
      /** Bring your own evaluator (tests, other models). */
      kind: "custom";
      evaluate: Evaluator;
    };

export interface JevClientOptions {
  provider?: JevProvider;
  /** Per-attempt timeout in ms. Default 8000. */
  timeoutMs?: number;
  /** Retries on 408/429/5xx. Default 1. */
  retries?: number;
  fetch?: typeof fetch;
}

const env = (k: string): string | undefined =>
  typeof process !== "undefined" && process.env ? process.env[k] : undefined;

/** Pick a provider from the environment: TypeSafe key, Vercel AI Gateway key, OpenRouter key, else heuristic. */
export function resolveProvider(p?: JevProvider): JevProvider {
  if (p) return p;
  if (env("TYPESAFE_API_KEY")) return { kind: "typesafe" };
  if (env("AI_GATEWAY_API_KEY")) return { kind: "vercel-gateway" };
  if (env("OPENROUTER_API_KEY")) return { kind: "openrouter" };
  return { kind: "heuristic" };
}

export function providerName(p: JevProvider): string {
  switch (p.kind) {
    case "typesafe":
      return `typesafe:${p.model ?? "jev-latest"}`;
    case "vercel-gateway":
      return `vercel-gateway:${p.model ?? "typesafe-ai/jev"}`;
    case "openrouter":
      return `openrouter:${p.model ?? "jev-latest"}`;
    case "heuristic":
      return "heuristic";
    case "custom":
      return "custom";
  }
}

export class JevError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Jev request failed with status ${status}`);
    this.name = "JevError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Minimal, dependency-free client for the System One endpoint. Works against
 * TypeSafe directly and against Vercel AI Gateway's TypeSafe-compatible API.
 */
export function createJevEvaluator(opts: JevClientOptions = {}): Evaluator {
  const provider = resolveProvider(opts.provider);
  if (provider.kind === "custom") return provider.evaluate;
  if (provider.kind === "heuristic") {
    throw new Error("createJevEvaluator: heuristic provider has no network evaluator; use evaluateHeuristic()");
  }
  const fetchImpl = opts.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const timeoutMs = opts.timeoutMs ?? 8000;
  const retries = opts.retries ?? 1;

  const ENV_KEY = { typesafe: "TYPESAFE_API_KEY", "vercel-gateway": "AI_GATEWAY_API_KEY", openrouter: "OPENROUTER_API_KEY" } as const;
  const apiKey = provider.apiKey ?? env(ENV_KEY[provider.kind]);
  if (!apiKey) throw new Error(`createJevEvaluator: missing API key for provider ${provider.kind} (set ${ENV_KEY[provider.kind]})`);

  const baseURL =
    provider.kind === "typesafe"
      ? (provider.baseURL ?? "https://api.typesafe.ai").replace(/\/+$/, "")
      : provider.kind === "vercel-gateway"
        ? "https://ai-gateway.vercel.sh/typesafe"
        : "https://openrouter.ai/api";
  const DEFAULT_MODEL = { typesafe: "jev-latest", "vercel-gateway": "typesafe-ai/jev", openrouter: "jev-latest" } as const;
  const model = provider.model ?? DEFAULT_MODEL[provider.kind];
  const url = `${baseURL}/v1/systemone`;
  const extraHeaders: Record<string, string> =
    provider.kind === "openrouter" ? { "http-referer": "https://intentflags.dev", "x-title": "IntentFlags" } : {};

  return async (state, questions) => {
    const body = JSON.stringify({ model, state, questions });
    let attempt = 0;
    for (;;) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetchImpl(url, {
          method: "POST",
          headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", ...extraHeaders },
          body,
          signal: ctrl.signal,
        });
        const text = await res.text();
        let json: unknown = undefined;
        try {
          json = text ? JSON.parse(text) : undefined;
        } catch {
          json = text;
        }
        if (!res.ok) {
          const retryable = res.status === 408 || res.status === 429 || res.status >= 500;
          if (retryable && attempt < retries) {
            attempt += 1;
            const ra = Number(res.headers.get("retry-after"));
            await sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 5000) : 400 * attempt);
            continue;
          }
          const msg =
            json && typeof json === "object" && "message" in json ? String((json as { message: unknown }).message) : undefined;
          throw new JevError(res.status, json, msg);
        }
        return json as RawResult;
      } catch (err) {
        if (err instanceof JevError) throw err;
        if (attempt < retries) {
          attempt += 1;
          await sleep(400 * attempt);
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
      }
    }
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
