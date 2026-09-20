"use client";

import { useVisitorState } from "intentflags";
import { useEffect, useState } from "react";
import { useAdaptive } from "../adaptive/adaptive-context";
import { Code, SectionHeader } from "../ui";

export type DocSnippets = Record<
  "install" | "provider" | "route" | "env" | "useIntent" | "intentComponent" | "visitorState" | "custom" | "customClient" | "core" | "snapshot" | "response" | "markup",
  string
>;

type TabId = "quickstart" | "hooks" | "server" | "custom" | "payloads" | "vanilla";

const TABS: Array<[TabId, string]> = [
  ["quickstart", "Quickstart"],
  ["hooks", "Hooks & components"],
  ["server", "Server route"],
  ["custom", "Custom questions"],
  ["payloads", "Payloads"],
  ["vanilla", "Vanilla JS"],
];

export function Docs({ s }: { s: DocSnippets }) {
  const { adaptations } = useAdaptive();
  const state = useVisitorState();
  const [tab, setTab] = useState<TabId>("quickstart");
  const [touched, setTouched] = useState(false);

  // expertise picks the opening tab until the visitor chooses one themselves
  useEffect(() => {
    if (touched) return;
    if (adaptations.docsMode === "expert") setTab("server");
    else if (adaptations.docsMode === "guided") setTab("quickstart");
  }, [adaptations.docsMode, touched]);

  const guided = adaptations.docsMode === "guided";
  const expert = adaptations.docsMode === "expert";

  return (
    <section id="docs" data-section="docs" className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader
            eyebrow="API reference · intentflags 0.1"
            title="Three imports. One route. Your Jev key."
            lede={
              guided
                ? "You don’t need to know how the model works. Copy the three snippets in Quickstart in order and you have intent flags."
                : expert
                  ? "The SDK is dependency-free, ~10 KB gzipped, ships ESM + CJS + types, and the server handler is a Web-standard (Request) → Response function."
                  : "Install the package, wrap your app, mount one route. Everything below is real and runs on this page."
            }
          />
          <span className="font-mono text-[11px] text-ink-3">
            docs mode: <span className="text-ink">{adaptations.docsMode}</span>
            {adaptations.evaluated ? ` · expertise ${Math.round(state.expertise * 100)}%` : ""}
          </span>
        </div>

        <div className="mt-10 rounded-[12px] border border-line">
          <div role="tablist" aria-label="Documentation" className="thin-scroll flex overflow-x-auto border-b border-line bg-paper px-2">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                id={`docs-${id}`}
                data-intent={`Docs tab: ${label}`}
                onClick={() => {
                  setTab(id);
                  setTouched(true);
                }}
                className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-[0.9rem] ${tab === id ? "border-signal text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="p-5 sm:p-8">
            {tab === "quickstart" ? (
              <Grid>
                <Doc title="1 · Install" body={guided ? "Run this in your project folder." : undefined}>
                  <Code html={s.install} />
                </Doc>
                <Doc title="2 · Wrap your app" body={guided ? "The provider starts listening. It does nothing visible on its own." : "Client component; safe in a Server Component layout."}>
                  <Code html={s.provider} />
                </Doc>
                <Doc title="3 · Add the route" body={guided ? "This is the only place your Jev key is used. It never reaches the browser." : "Provider resolves from TYPESAFE_API_KEY, then AI_GATEWAY_API_KEY, else the labelled heuristic."}>
                  <Code html={s.route} />
                  <Code html={s.env} className="mt-3" />
                </Doc>
                <Doc title="4 · Use a flag" body={guided ? "Confidence goes from 0 to 1. Start with 0.6 and adjust." : undefined}>
                  <Code html={s.useIntent} />
                </Doc>
              </Grid>
            ) : null}

            {tab === "hooks" ? (
              <Grid>
                <Doc title="useIntent(id, { threshold })" body="Returns { id, confidence, active, evaluated, state }. Ids: any intent, next:<action>, expertise, friction, purchase_intent, abandon_risk, or a custom question.">
                  <Code html={s.useIntent} />
                </Doc>
                <Doc title="<Intent when confidence not fallback>" body="Declarative form. `when` accepts one id or several (any match).">
                  <Code html={s.intentComponent} />
                </Doc>
                <Doc title="useVisitorState()" body="The whole typed state. Re-renders only when a judgment lands (every 4–20 s), not on every event." wide>
                  <Code html={s.visitorState} />
                </Doc>
                <Doc title="Markup hints" body="Optional attributes make events more legible to the model." wide>
                  <Code html={s.markup} />
                </Doc>
              </Grid>
            ) : null}

            {tab === "server" ? (
              <Grid>
                <Doc title="createIntentHandler(options)" body="Web-standard handler. Works in Next.js route handlers, Hono, Remix, SvelteKit, Cloudflare Workers.">
                  <Code html={s.route} />
                </Doc>
                <Doc title="Options">
                  <Ref
                    rows={[
                      ["siteContext", "string", "One or two sentences about your site and its section ids. Grounds every judgment."],
                      ["questions", "Record<id, Question>", "Extra Jev questions merged over the six defaults."],
                      ["provider", "JevProvider", "{ kind: 'typesafe' | 'vercel-gateway' | 'openrouter' | 'heuristic' | 'custom' }. Auto from env when omitted."],
                      ["allowDebug", "boolean", "Let clients request the raw model exchange. Off by default."],
                      ["cors", "true | string[]", "Emit CORS headers for cross-origin sites."],
                      ["authorize", "(req, body) => Response | void", "Rate-limit, check a project key, reject bots."],
                      ["onDecision", "({ snapshot, response, durationMs }) => void", "Log or store every decision."],
                      ["timeoutMs / retries", "number", "Per-attempt timeout (8000) and retries on 429/5xx (1)."],
                      ["fallbackOnError", "boolean", "Serve the heuristic when Jev fails. Default true."],
                    ]}
                  />
                </Doc>
                <Doc title="Environment" wide>
                  <Code html={s.env} />
                  <p className="mt-3 text-[13px] text-ink-3">
                    Directly the request hits <code className="inline">api.typesafe.ai/v1/systemone</code> with <code className="inline">jev-latest</code>; through Vercel AI
                    Gateway it is <code className="inline">ai-gateway.vercel.sh/typesafe/v1/systemone</code> with <code className="inline">typesafe-ai/jev</code>; through OpenRouter it is{" "}
                    <code className="inline">openrouter.ai/api/v1/systemone</code> with <code className="inline">jev-latest</code>. Same shapes all three ways.
                  </p>
                </Doc>
              </Grid>
            ) : null}

            {tab === "custom" ? (
              <Grid>
                <Doc title="Define questions on the server" body="Three primitives: noul (yes/no probability), choice (one of N with a distribution), score (ordered rubric, interpolated). Same shapes Jev accepts natively.">
                  <Code html={s.custom} />
                </Doc>
                <Doc title="Read them in the client" body="noul and score become one flag. choice becomes one flag per option plus the winner’s confidence under the bare id.">
                  <Code html={s.customClient} />
                </Doc>
              </Grid>
            ) : null}

            {tab === "payloads" ? (
              <Grid>
                <Doc title="What the browser sends" body="A compact snapshot, ~2–4 KB. No coordinates, keystrokes, or field values. Section ids come from data-section or the element id.">
                  <Code html={s.snapshot} />
                </Doc>
                <Doc title="What comes back" body="Normalized 0..1 everywhere. flags is the flat map the hooks read. meta tells you whether Jev or the heuristic answered.">
                  <Code html={s.response} />
                </Doc>
              </Grid>
            ) : null}

            {tab === "vanilla" ? (
              <Grid>
                <Doc title="intentflags/core" body="No React. Same collector and client, framework-agnostic subscription. Works with Vue, Svelte, Astro islands, or plain HTML." wide>
                  <Code html={s.core} />
                </Doc>
              </Grid>
            ) : null}
          </div>
        </div>

        <div id="docs-custom" className="mt-8 grid gap-6 md:grid-cols-3">
          <Fact k="Bundle" v="≈10 KB gzip" d="ESM + CJS, TypeScript types, React ≥18 optional peer." />
          <Fact k="Latency" v="70–500 ms" d="Jev returns all six answers in one pass; nothing streams." />
          <Fact k="Cost" v="≈ $0.00007 / decision" d="≈1,700 input tokens at $0.042 per million. Output is free." />
        </div>
      </div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-8 lg:grid-cols-2">{children}</div>;
}

function Doc({ title, body, children, wide }: { title: string; body?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "lg:col-span-2" : ""}>
      <h3 className="font-mono text-[13.5px] text-ink">{title}</h3>
      {body ? <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{body}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Ref({ rows }: { rows: Array<[string, string, string]> }) {
  return (
    <dl className="divide-y divide-line rounded-[8px] border border-line">
      {rows.map(([k, t, d]) => (
        <div key={k} className="px-3 py-2.5">
          <dt className="flex flex-wrap items-baseline gap-2">
            <code className="font-mono text-[12.5px] text-ink">{k}</code>
            <span className="font-mono text-[11px] text-ink-3">{t}</span>
          </dt>
          <dd className="mt-0.5 text-[12.5px] text-ink-2">{d}</dd>
        </div>
      ))}
    </dl>
  );
}

function Fact({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className="rounded-[10px] border border-line p-4">
      <div className="eyebrow">{k}</div>
      <div className="display mt-1 text-[1.6rem]">{v}</div>
      <p className="mt-1 text-[13px] text-ink-2">{d}</p>
    </div>
  );
}
