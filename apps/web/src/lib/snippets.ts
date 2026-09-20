import type { Lang } from "./highlight";

export const SNIPPETS: Record<string, { code: string; lang: Lang }> = {
  install: { lang: "bash", code: `npm install intentflags` },

  provider: {
    lang: "tsx",
    code: `// app/layout.tsx
import { IntentFlagsProvider } from "intentflags";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <IntentFlagsProvider endpoint="/api/intent">
          {children}
        </IntentFlagsProvider>
      </body>
    </html>
  );
}`,
  },

  route: {
    lang: "ts",
    code: `// app/api/intent/route.ts
import { createIntentHandler } from "intentflags/server";

export const POST = createIntentHandler({
  siteContext:
    "Acme OCR API — developer landing page. " +
    "Sections: hero, docs, integrations, pricing, faq.",
});`,
  },

  env: {
    lang: "bash",
    code: `# .env — pick one
TYPESAFE_API_KEY=ts_…        # direct: api.typesafe.ai, model jev-latest
AI_GATEWAY_API_KEY=vck_…     # via Vercel AI Gateway, model typesafe-ai/jev
OPENROUTER_API_KEY=sk-or-v1-… # via OpenRouter, model jev-latest`,
  },

  useIntent: {
    lang: "tsx",
    code: `import { useIntent } from "intentflags";

function Hero() {
  const technical = useIntent("technical_evaluation");

  if (technical.confidence > 0.8) {
    return <TechnicalHero />;
  }
  return <DefaultHero />;
}`,
  },

  intentComponent: {
    lang: "tsx",
    code: `import { Intent } from "intentflags";

<Intent when="price_comparison" confidence={0.75}>
  <PricingComparison />
</Intent>

<Intent
  when={["ready_to_buy", "next:sign_up"]}
  fallback={<LearnMore />}
>
  <StartTrial />
</Intent>

<Intent when="friction" confidence={0.6}>
  <ThirtySecondVersion />
</Intent>`,
  },

  visitorState: {
    lang: "tsx",
    code: `import { useVisitorState } from "intentflags";

const visitor = useVisitorState();

visitor.intent.value          // "technical_evaluation"
visitor.intent.confidence     // 0.91
visitor.intent.probabilities  // { exploring: 0.04, technical_evaluation: 0.91, … }
visitor.nextAction.value      // "read_docs"
visitor.expertise             // 0.86
visitor.friction              // 0.18
visitor.purchaseIntent        // 0.61
visitor.abandonRisk           // 0.12
visitor.flags["next:view_pricing"]
visitor.meta                  // { source: "jev", model: "typesafe/jev-1.13-…", latencyMs: 361, costUsd: 0.0000718 }

if (visitor.intent.value === "technical_evaluation" && visitor.expertise > 0.8) {
  reorderSections(["api", "integrations", "security", "pricing", "testimonials"]);
}`,
  },

  custom: {
    lang: "ts",
    code: `// app/api/intent/route.ts
import { createIntentHandler } from "intentflags/server";

export const POST = createIntentHandler({
  siteContext: "Acme OCR API — developer landing page.",
  questions: {
    enterprise_buyer: {
      type: "noul",
      instructions: "Is this visitor evaluating on behalf of a large organization?",
    },
    persona: {
      type: "choice",
      instructions: "Who is this visitor most likely to be?",
      criteria: {
        founder: "Deciding whether to adopt; reads pricing and outcomes",
        engineer: "Deciding whether it works; reads API and integrations",
        marketer: "Deciding whether it converts; reads examples and case studies",
      },
    },
    urgency: {
      type: "score",
      instructions: "How urgent is the visitor's need?",
      criteria: ["no urgency", "this quarter", "this week", "today"],
    },
  },
});`,
  },

  customClient: {
    lang: "tsx",
    code: `useIntent("enterprise_buyer").confidence   // 0..1  (noul)
useIntent("persona:engineer").active       // choice option ≥ threshold
useIntent("persona").confidence            // winner's confidence
useIntent("urgency").confidence            // 0..1  (score, normalized)

<Intent when="persona:founder" confidence={0.6}>
  <OutcomesFirst />
</Intent>`,
  },

  core: {
    lang: "ts",
    code: `import { createIntentFlags } from "intentflags/core";

const flags = createIntentFlags({ endpoint: "/api/intent" });

flags.subscribe((state) => {
  document.body.dataset.intent = state.intent.value;
  document.body.dataset.expertise = state.expertise > 0.7 ? "expert" : "default";
});

// your own semantic events
flags.track("opened_pricing_calculator");
flags.setContext({ plan: "free", experiment: "hero-b" });

// read at any time
flags.getState().flags["next:view_pricing"];`,
  },

  markup: {
    lang: "tsx",
    code: `{/* sections are recognised by data-section or id */}
<section data-section="pricing" data-section-label="Plans and limits">…</section>

{/* a readable name for a control the model will see in the timeline */}
<button data-intent="Compare plans">Compare</button>

{/* pause collection until consent */}
<IntentFlagsProvider disabled={!consent} />`,
  },

  snapshot: {
    lang: "json",
    code: `{
  "v": 1,
  "visitorId": "8f3c…", "sessionId": "1a9e…",
  "page": {
    "path": "/", "title": "IntentFlags",
    "referrer": "https://news.ycombinator.com/",
    "entry": { "path": "/", "referrer": "https://news.ycombinator.com/", "utm": { "source": "hn" } }
  },
  "visit": { "number": 1, "returning": false, "sessionSeconds": 74, "pageviews": 1 },
  "device": { "type": "desktop", "viewport": { "w": 1440, "h": 900 }, "touch": false, "language": "en-US" },
  "scroll": { "maxDepth": 0.62, "current": 0.41 },
  "sections": [
    { "id": "docs", "label": "API reference", "viewedMs": 31200, "hoverMs": 18400, "views": 2 },
    { "id": "pricing", "label": "Pricing", "viewedMs": 6100, "hoverMs": 900, "views": 1 }
  ],
  "actions": [
    { "t": 0.0,  "type": "pageview", "target": "/" },
    { "t": 6.2,  "type": "section_enter", "target": "docs" },
    { "t": 14.8, "type": "hover", "target": "code:npm install intentflags", "detail": "3.1s" },
    { "t": 15.9, "type": "copy",  "target": "code:npm install intentflags" },
    { "t": 41.0, "type": "section_enter", "target": "pricing" },
    { "t": 48.3, "type": "scroll_return", "target": "docs", "detail": "7s later" }
  ],
  "cursor": { "idleMs": 0, "hesitations": 1, "rageClicks": 0, "exitIntents": 0, "copies": 1 }
}`,
  },

  response: {
    lang: "json",
    code: `{
  "state": {
    "intent":     { "value": "technical_evaluation", "confidence": 0.91,
                    "probabilities": { "exploring": 0.04, "technical_evaluation": 0.91, "price_comparison": 0.03, … } },
    "nextAction": { "value": "read_docs", "confidence": 0.76, "probabilities": { … } },
    "expertise": 0.86,
    "friction": 0.18,
    "purchaseIntent": 0.61,
    "abandonRisk": 0.12,
    "flags": {
      "technical_evaluation": 0.91, "price_comparison": 0.03, "next:read_docs": 0.76,
      "expertise": 0.86, "friction": 0.18, "purchase_intent": 0.61, "abandon_risk": 0.12
    },
    "meta": { "source": "jev", "model": "typesafe/jev-1.13-20260917", "latencyMs": 361, "inputTokens": 1709, "costUsd": 0.0000718 }
  }
}`,
  },

  question: {
    lang: "json",
    code: `"intent": {
  "type": "choice",
  "instructions": "What is the visitor currently trying to do?",
  "criteria": {
    "exploring": "…", "technical_evaluation": "…",
    "price_comparison": "…", "ready_to_buy": "…",
    "seeking_support": "…", "insufficient_signal": "…"
  }
}
// → { "choice": "technical_evaluation", "confidence": 0.91,
//     "probabilities": { "technical_evaluation": 0.91, … } }`,
  },

  act: {
    lang: "tsx",
    code: `const tech = useIntent("technical_evaluation");
const price = useIntent("price_comparison");

<Intent when="technical_evaluation" confidence={0.6}>
  <ApiReferenceFirst />
</Intent>

<CallToAction
  label={price.active ? "Compare plans" : "Start building"}
/>`,
  },
};
