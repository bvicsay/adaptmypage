import type { IntentRequest, Snapshot } from "../core/types";
import { createEvaluator, type EvaluateOptions } from "./evaluate";

export interface IntentHandlerOptions extends EvaluateOptions {
  /**
   * Allow clients to request the raw model exchange (`debug: true`).
   * Default false. Turn on for development HUDs; the payload includes your
   * question texts.
   */
  allowDebug?: boolean;
  /** `true` for `*`, or an allow-list of origins. Default: no CORS headers (same-origin). */
  cors?: boolean | string[];
  /** Reject bodies larger than this many bytes. Default 96 KiB. */
  maxBodyBytes?: number;
  /** Hook to reject or throttle requests. Return a Response to short-circuit. */
  authorize?: (req: Request, body: IntentRequest) => Promise<Response | void> | Response | void;
  /** Observe every decision (log it, store it, bill it). */
  onDecision?: (info: { snapshot: Snapshot; response: Awaited<ReturnType<ReturnType<typeof createEvaluator>>>; durationMs: number }) => void | Promise<void>;
}

/**
 * A Web-standard `(Request) => Promise<Response>` handler. Mount it as a
 * Next.js route handler, a Hono/Elysia route, a Cloudflare Worker, or anything
 * else that speaks `fetch`.
 *
 *   // app/api/intent/route.ts
 *   import { createIntentHandler } from "intentflags/server";
 *   export const POST = createIntentHandler({ siteContext: "..." });
 */
export function createIntentHandler(options: IntentHandlerOptions = {}) {
  const evaluate = createEvaluator(options);
  const maxBody = options.maxBodyBytes ?? 96 * 1024;

  const corsHeaders = (req: Request): Record<string, string> => {
    if (!options.cors) return {};
    const origin = req.headers.get("origin") ?? "";
    const allow = options.cors === true ? "*" : options.cors.includes(origin) ? origin : "";
    if (!allow) return {};
    return {
      "access-control-allow-origin": allow,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
      ...(allow !== "*" ? { vary: "origin" } : {}),
    };
  };

  const json = (req: Request, body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store", ...corsHeaders(req) },
    });

  return async function handler(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
    if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

    const len = Number(req.headers.get("content-length") ?? "0");
    if (len > maxBody) return json(req, { error: "payload_too_large" }, 413);

    let body: IntentRequest;
    try {
      const text = await req.text();
      if (text.length > maxBody) return json(req, { error: "payload_too_large" }, 413);
      body = JSON.parse(text);
    } catch {
      return json(req, { error: "invalid_json" }, 400);
    }

    const problem = validateSnapshot(body?.snapshot);
    if (problem) return json(req, { error: "invalid_snapshot", detail: problem }, 400);

    if (options.authorize) {
      const early = await options.authorize(req, body);
      if (early) return early;
    }

    const started = Date.now();
    try {
      const debug = Boolean(body.debug) && Boolean(options.allowDebug);
      const response = await evaluate(body.snapshot, { debug });
      if (options.onDecision) {
        try {
          await options.onDecision({ snapshot: body.snapshot, response, durationMs: Date.now() - started });
        } catch {
          /* observers must not break decisions */
        }
      }
      return json(req, response);
    } catch (err) {
      return json(req, { error: "evaluation_failed", detail: (err as Error)?.message ?? String(err) }, 502);
    }
  };
}

/** Structural validation without a schema library, so the SDK stays dependency-free. */
export function validateSnapshot(s: unknown): string | null {
  if (!s || typeof s !== "object") return "snapshot missing";
  const o = s as Record<string, unknown>;
  if (o.v !== 1) return "unsupported snapshot version";
  if (typeof o.visitorId !== "string" || typeof o.sessionId !== "string") return "ids missing";
  if (!o.page || typeof o.page !== "object") return "page missing";
  if (!Array.isArray(o.actions)) return "actions must be an array";
  if (o.actions.length > 400) return "too many actions";
  if (!Array.isArray(o.sections)) return "sections must be an array";
  if (o.sections.length > 200) return "too many sections";
  for (const a of o.actions as unknown[]) {
    if (!a || typeof a !== "object") return "invalid action";
    const act = a as Record<string, unknown>;
    if (typeof act.type !== "string" || typeof act.t !== "number") return "invalid action";
    if (act.target !== undefined && (typeof act.target !== "string" || act.target.length > 200)) return "action target too long";
    if (act.detail !== undefined && (typeof act.detail !== "string" || act.detail.length > 200)) return "action detail too long";
  }
  if (o.context !== undefined) {
    if (!o.context || typeof o.context !== "object") return "context must be an object";
    if (Object.keys(o.context as object).length > 40) return "too many context keys";
  }
  return null;
}
