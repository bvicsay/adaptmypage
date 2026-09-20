# Security

**Do not open a public issue for a vulnerability.** Email barnabas.vicsay@pentacode.app with the details and steps to reproduce. You will get a reply within a few days.

## What the SDK sends

The browser collector sends a compact snapshot of semantic behavior to the endpoint you configure: page path and title, referrer host, UTM tags, device class, session timing, per-section view/hover time, scroll depth and a timeline of events such as `click button:Compare plans`. It never sends mouse coordinates, keystrokes or form field values. The full shape is `Snapshot` in `packages/adaptmypage/src/core/types.ts`.

## Keys

Model keys (`TYPESAFE_API_KEY`, `AI_GATEWAY_API_KEY`, `OPENROUTER_API_KEY`) are read only inside `adaptmypage/server`. They never reach the browser. `.env` files are gitignored.
