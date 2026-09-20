import { createIntentHandler } from "adaptmypage/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The same handler a customer would mount. This site is its own first user.
 * Provider is resolved from TYPESAFE_API_KEY → AI_GATEWAY_API_KEY → OPENROUTER_API_KEY → heuristic.
 */
const handler = createIntentHandler({
  siteContext:
    "adaptmypage.com — landing page for adaptmypage, an open-source React SDK that turns a visitor's live intent into feature flags using the Jev decision model. " +
    "Audience: React/Next.js developers and small SaaS teams. Sections: hero (headline that rewrites itself, install command), how (observe → ask Jev → change the page), " +
    "flags (the six built-in judgments with the visitor's live values), docs (route + hook code samples, link to full reference on GitHub), pricing (open source, self-host cost, hosted early access), " +
    "subscribe (email list). Pop-up cards explain each change and why it happened. A side panel shows the visitor their own inferred state.",
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
