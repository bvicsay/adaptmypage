import type { Lang } from "./highlight";

export const SNIPPETS: Record<string, { code: string; lang: Lang }> = {
  install: { lang: "bash", code: `npm install adaptmypage` },

  route: {
    lang: "ts",
    code: `// app/api/intent/route.ts
import { createIntentHandler } from "adaptmypage/server";

export const POST = createIntentHandler({
  siteContext: "Acme — developer landing page. Sections: hero, docs, pricing.",
});
// .env  →  OPENROUTER_API_KEY, TYPESAFE_API_KEY or AI_GATEWAY_API_KEY`,
  },

  use: {
    lang: "tsx",
    code: `import { IntentFlagsProvider, Intent, useIntent } from "adaptmypage";

<IntentFlagsProvider endpoint="/api/intent">
  <App />
</IntentFlagsProvider>

const price = useIntent("price_comparison");   // { confidence: 0.81, active: true }

<Intent when="technical_evaluation" confidence={0.7}>
  <ApiFirstHero />
</Intent>`,
  },

  state: {
    lang: "tsx",
    code: `const v = useVisitorState();

v.intent.value      // "technical_evaluation"
v.intent.confidence // 0.81
v.nextAction.value  // "read_docs"
v.expertise         // 0.75
v.friction          // 0.12
v.purchaseIntent    // 0.44
v.abandonRisk       // 0.08
v.meta.model        // "typesafe/jev-1.13-…"  ·  v.meta.latencyMs  // 361`,
  },

  raw: {
    lang: "json",
    code: `// what Jev returns for one question (raw, before normalisation)
"intent": {
  "type": "choice",
  "choice": "technical_evaluation",
  "confidence": 0.81,
  "probabilities": {
    "technical_evaluation": 0.81, "exploring": 0.09,
    "price_comparison": 0.05, "ready_to_buy": 0.03, …
  }
}`,
  },
};
