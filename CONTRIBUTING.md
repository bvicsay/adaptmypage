# Contributing to adaptmypage

Thanks for helping. This is a small project with a simple loop.

## Setup

```bash
pnpm install
pnpm --filter adaptmypage dev      # rebuild the SDK on save (terminal 1)
pnpm --filter web dev              # the landing page at http://localhost:3000 (terminal 2)
```

Copy `apps/web/.env.example` to `apps/web/.env`. Without a Jev key the API route answers with the heuristic evaluator, which is enough for UI work.

## Before opening a pull request

```bash
pnpm typecheck
pnpm test
pnpm build
```

- SDK changes need a test in `packages/adaptmypage/test`.
- Keep the SDK dependency-free. React stays an optional peer.
- The browser collector records **semantic** events only. Never add coordinates, keystrokes or field values.
- Anything that changes what is sent to the model (`buildModelState`, `DEFAULT_QUESTIONS`) should come with a before/after example in the PR description.

## Releasing the SDK

1. Bump `version` in `packages/adaptmypage/package.json` and add a `CHANGELOG.md` entry.
2. Tag `adaptmypage@x.y.z` and push; the publish workflow needs an `NPM_TOKEN` repository secret. Or publish locally with `pnpm --filter adaptmypage publish --access public`.

## Conduct

Be kind and specific. Disagree with the code, not the person.
