# Changelog

## 0.1.0 — 2026-09-20

Initial release.

- Browser collector for semantic events (sections, dwell, hover, copy, forms, exit intent, rage clicks, idle)
- `createIntentFlags()` core client with debounced, heartbeat evaluations and session persistence
- React: `IntentFlagsProvider`, `useIntent`, `<Intent>`, `useVisitorState`, `useIntentActions`, `useIntentDebug`
- Server: `createIntentHandler`, `createEvaluator`, Jev client (TypeSafe direct or Vercel AI Gateway), heuristic fallback, custom questions
- Six built-in judgments: intent, next action, expertise, friction, purchase intent, abandon risk
