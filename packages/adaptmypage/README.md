# adaptmypage

**Semantic feature flags for websites, powered by [Jev](https://vercel.com/i/what-is-jev).**

adaptmypage watches what a visitor is doing right now — sections read, code copied, prices hovered, forms touched — asks Jev (TypeSafe AI's decision model) what the visitor is trying to do, and exposes the answer to your React code as an ordinary feature flag.

```tsx
import { useIntent } from "adaptmypage";

function Hero() {
  const technical = useIntent("technical_evaluation");
  if (technical.confidence > 0.8) return <TechnicalHero />;
  return <DefaultHero />;
}
```

Your code stays deterministic. The fuzzy judgment is the model's.

- ~10 KB gzipped, dependency-free, ESM + CJS + types, React ≥ 18 optional peer
- Semantic events only: no coordinates, keystrokes or form values leave the browser
- Six built-in judgments (intent, next action, expertise, friction, purchase intent, abandon risk) plus your own questions
- Server handler is a Web-standard `(Request) => Promise<Response>` — Next.js, Hono, Remix, SvelteKit, Workers
- Works without a key (labelled heuristic) so dev and CI never depend on the network

Live demo: the landing page at **adaptmypage.com** runs this SDK on itself and shows you your own inferred state.

## Install

```bash
npm install adaptmypage
```

## Quickstart (Next.js App Router)

**1. Wrap your app**

```tsx
// app/layout.tsx
import { IntentFlagsProvider } from "adaptmypage";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <IntentFlagsProvider endpoint="/api/intent">{children}</IntentFlagsProvider>
      </body>
    </html>
  );
}
```

**2. Mount the route** — the only place your Jev key is used.

```ts
// app/api/intent/route.ts
import { createIntentHandler } from "adaptmypage/server";

export const POST = createIntentHandler({
  siteContext: "Acme OCR API — developer landing page. Sections: hero, docs, integrations, pricing, faq.",
});
```

```bash
# .env — pick one
TYPESAFE_API_KEY=ts_…        # direct: api.typesafe.ai, model jev-latest
AI_GATEWAY_API_KEY=vck_…     # via Vercel AI Gateway, model typesafe-ai/jev
OPENROUTER_API_KEY=sk-or-v1-… # via OpenRouter, model jev-latest
```

**3. Use a flag**

```tsx
import { Intent, useIntent, useVisitorState } from "adaptmypage";

<Intent when="price_comparison" confidence={0.75}>
  <PricingComparison />
</Intent>;

const visitor = useVisitorState();
if (visitor.intent.value === "technical_evaluation" && visitor.expertise > 0.8) {
  reorderSections(["api", "integrations", "security", "pricing", "testimonials"]);
}
```

## Built-in flags

| id | kind | meaning |
| --- | --- | --- |
| `exploring` | intent | Orienting, skimming several sections |
| `technical_evaluation` | intent | Reading docs/API/code, copying code, returning to technical sections |
| `price_comparison` | intent | Focused on pricing, plans, limits |
| `ready_to_buy` | intent | Heading to sign-up/install, touching a form, returning with a goal |
| `seeking_support` | intent | FAQ, troubleshooting, contact |
| `insufficient_signal` | intent | Too little behavior to judge |
| `next:read_docs` … `next:leave` | next action | `read_docs`, `view_pricing`, `sign_up`, `check_integrations`, `review_security`, `contact`, `leave` |
| `expertise` | 0..1 | Non-technical → senior engineer |
| `friction` | 0..1 | Smooth → stuck (rage clicks, hesitation, re-reading) |
| `purchase_intent` | 0..1 | None → imminent |
| `abandon_risk` | 0..1 | Probability of leaving within ~30 s without acting |

## API

### `<IntentFlagsProvider {...options}>`

| option | default | |
| --- | --- | --- |
| `endpoint` | `/api/intent` | Where snapshots are POSTed |
| `debug` | `false` | Ask the server for the raw model exchange (server must set `allowDebug`) |
| `minIntervalMs` / `debounceMs` / `heartbeatMs` | 4000 / 2000 / 20000 | Evaluation cadence |
| `initialDelayMs` | 1500 | Delay before the first judgment |
| `sectionSelector` | `[data-section], section[id], main > [id]` | What counts as a section |
| `context` | — | Developer context merged into every snapshot (plan, experiment, …) |
| `disabled` | `false` | No listeners, no network (consent gating, tests) |
| `persist` | `true` | Restore the session's last state from `sessionStorage` |
| `onState` / `onAction` / `onError` | — | Callbacks |

### Hooks and components

- `useIntent(id, { threshold = 0.6 })` → `{ id, confidence, active, evaluated, state }`
- `<Intent when={id | id[]} confidence not fallback>`
- `useVisitorState()` → the full typed `VisitorState`
- `useIntentActions(limit)` → live semantic events
- `useIntentDebug()` → `{ state, actions, lastResponse, evaluating, evaluate(), track() }`
- `useIntentFlags()` → the underlying client (`track`, `setContext`, `evaluate`, `getSnapshot`)

### `adaptmypage/core` (no React)

```ts
import { createIntentFlags } from "adaptmypage/core";
const flags = createIntentFlags({ endpoint: "/api/intent" });
flags.subscribe((state) => (document.body.dataset.intent = state.intent.value));
flags.track("opened_pricing_calculator");
```

### `adaptmypage/server`

`createIntentHandler(options)` returns a `(Request) => Promise<Response>`.

| option | |
| --- | --- |
| `siteContext` | One or two sentences about your site and its section ids |
| `questions` | Extra Jev questions merged over the defaults (`noul`, `choice`, `score`) |
| `provider` | `{ kind: "typesafe" | "vercel-gateway" | "openrouter" | "heuristic" | "custom" }`; resolved from env when omitted |
| `allowDebug` | Let clients request the raw model exchange |
| `cors` | `true` or an origin allow-list |
| `authorize(req, body)` | Return a `Response` to reject or throttle |
| `onDecision({ snapshot, response, durationMs })` | Log or store decisions |
| `timeoutMs`, `retries`, `fallbackOnError` | 8000, 1, `true` |

Lower-level pieces are exported too: `createEvaluator`, `toVisitorState`, `buildModelState`, `evaluateHeuristic`, `createJevEvaluator`, `validateSnapshot`.

### Custom questions

```ts
export const POST = createIntentHandler({
  questions: {
    enterprise_buyer: { type: "noul", instructions: "Is this visitor evaluating on behalf of a large organization?" },
    persona: {
      type: "choice",
      instructions: "Who is this visitor most likely to be?",
      criteria: { founder: "…", engineer: "…", marketer: "…" },
    },
    urgency: { type: "score", instructions: "How urgent is the need?", criteria: ["none", "this quarter", "this week", "today"] },
  },
});
```

```tsx
useIntent("enterprise_buyer").confidence; // noul → 0..1
useIntent("persona:engineer").active;     // choice option
useIntent("urgency").confidence;          // score, normalized 0..1
```

## Markup hints

```tsx
<section data-section="pricing" data-section-label="Plans and limits">…</section>
<button data-intent="Compare plans">Compare</button>
```

## What is sent

A compact snapshot (~2–4 KB): page path and title, referrer host, UTM tags, device class, session seconds, per-section view/hover time, scroll depth, and a timeline of semantic events (`click button:Compare plans`, `copy code:npm install adaptmypage`, `scroll_return docs`, `exit_intent`, …). The server turns it into a readable state object and sends it to Jev with typed questions. A decision on a busy page is about 1,700 input tokens ≈ $0.00007 at Jev's list price; output is free.

## License

MIT
