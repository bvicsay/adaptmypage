<p align="center">
  <img src="apps/web/public/icon.svg" width="56" alt="" />
</p>
<h1 align="center">IntentFlags</h1>
<p align="center">
  <a href="https://github.com/bvicsay/adaptmypage/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/bvicsay/adaptmypage/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/intentflags"><img alt="npm" src="https://img.shields.io/npm/v/intentflags?color=1b4dff"></a>
  <a href="LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-0c1222"></a>
</p>
<p align="center"><strong>Semantic feature flags for websites, powered by Jev.</strong><br/>
Your site knows what visitors clicked. Now it can know what they’re trying to do.</p>

```tsx
const technical = useIntent("technical_evaluation");
if (technical.confidence > 0.8) return <TechnicalHero />;
```

This repository holds the open-source SDK and the landing page that runs it on itself.

| path | what |
| --- | --- |
| [`packages/intentflags`](packages/intentflags) | The npm package: React hooks, `<Intent>`, vanilla core, server handler, Jev client, heuristic fallback, tests |
| [`apps/web`](apps/web) | The landing page (Next.js 16). Docs, pricing, email list, and a live side panel showing the visitor their own inferred state |

## How it works

1. **Observe.** The SDK collects semantic events in the browser: sections entering the viewport, dwell, hovers over controls, copied code, form activity, exit intent, rage clicks. No coordinates, keystrokes or field values.
2. **Judge.** Every few seconds a compact snapshot goes to one route. The route sends it to [Jev](https://vercel.com/i/what-is-jev) (TypeSafe AI's decision model) with six typed questions and gets probabilities back in one 70–500 ms pass.
3. **Act.** Your code reads the answer like any other flag.

Measured on this site through OpenRouter: six answers in ~300–500 ms for ~1,700 input tokens, about $0.00007 per judgment.

## Develop

```bash
pnpm install
pnpm build:sdk          # builds packages/intentflags → dist
pnpm dev                # builds the SDK, then runs the site at http://localhost:3000
pnpm test               # SDK unit tests (vitest + jsdom)
pnpm typecheck
```

Copy `apps/web/.env.example` to `apps/web/.env` and set **one** Jev credential:

```bash
TYPESAFE_API_KEY=…      # direct: https://typesafe.ai
# or
AI_GATEWAY_API_KEY=…    # https://vercel.com/ai-gateway/models/jev
# or
OPENROUTER_API_KEY=…    # https://openrouter.ai/typesafe
```

Without a key the API route answers with a transparent rules-based evaluator and every response is labelled `source: "heuristic"`. The live panel shows which one answered.

For the email list set `RESEND_API_KEY` + `RESEND_AUDIENCE_ID`, or `SUBSCRIBE_WEBHOOK_URL`. In development with neither set, sign-ups append to `apps/web/.data/subscribers.jsonl`.

While editing the SDK and the site together, run `pnpm --filter intentflags dev` in a second terminal so `dist/` rebuilds on save.

## Deploy the site

The site is a standard Next.js app. On Vercel:

1. Import the repository, set **Root Directory** to `apps/web`.
2. Build command `pnpm --filter intentflags build && pnpm --filter web build` (or leave the default and set the root `build` script) and install command `pnpm install`.
3. Add the environment variables above plus `NEXT_PUBLIC_SITE_URL=https://your-domain`.

## Publish the SDK

```bash
cd packages/intentflags
npm login
pnpm publish --access public     # runs typecheck + tests + build first
```

Bump `version` in `packages/intentflags/package.json` before each release.

## License

MIT © Barnabas Vicsay. Jev is a model by TypeSafe AI; IntentFlags is not affiliated with TypeSafe or Vercel.
