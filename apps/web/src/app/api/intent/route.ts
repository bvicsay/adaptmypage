import { createIntentHandler } from "intentflags/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The same handler a customer would mount. This site is its own first user.
 * Provider is resolved from TYPESAFE_API_KEY → AI_GATEWAY_API_KEY → OPENROUTER_API_KEY → heuristic.
 */
const handler = createIntentHandler({
  siteContext:
    "intentflags.dev — the landing page for IntentFlags, an open-source React SDK that turns a visitor's live intent into feature flags using the Jev decision model. " +
    "Audience: React/Next.js developers and small SaaS teams. Sections: hero (headline, install command, primary call to action), how (observe → judge → act), " +
    "flags (table of built-in intent identifiers), docs (API reference with code samples and tabs), pricing (open-source SDK, self-hosting cost, hosted API early access), " +
    "faq, subscribe (email list form). A side panel shows the visitor their own inferred state.",
  allowDebug: true,
  timeoutMs: 6000,
  retries: 1,
  onDecision: ({ response, durationMs }) => {
    if (process.env.NODE_ENV !== "production") {
      const s = response.state;
      console.log(
        `[intent] ${s.intent.value} ${(s.intent.confidence * 100).toFixed(0)}% · next ${s.nextAction.value} · exp ${s.expertise.toFixed(2)} · fric ${s.friction.toFixed(2)} · ${s.meta.source} ${durationMs}ms`,
      );
    }
  },
});

export const POST = handler;
export const OPTIONS = handler;
