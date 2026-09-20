"use client";

import { useVisitorState } from "intentflags";
import { useAdaptive } from "../adaptive/adaptive-context";
import { Button, Code, CopyButton, Meter, Pct } from "../ui";

export function Hero({ installHtml }: { installHtml: string }) {
  const { adaptations, panel } = useAdaptive();
  const state = useVisitorState();
  const evaluated = state.meta.source !== "initial";

  return (
    <section id="hero" data-section="hero" className="relative overflow-hidden">
      <div className="graph-paper pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <p className="eyebrow">Open-source React SDK · judged by Jev · no generated text</p>
          <h1 className="display mt-5 text-[2.6rem] sm:text-[3.6rem] lg:text-[4.1rem] text-ink">
            Your site knows what visitors clicked.
            <br />
            <span className="text-signal">Now it can know what they’re trying to do.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[1.1rem] leading-relaxed text-ink-2">
            IntentFlags watches semantic behavior — sections read, code copied, prices hovered — asks Jev what the visitor is doing,
            and hands your React code the answer as an ordinary feature flag. Your code stays deterministic. The fuzzy judgment is the model’s.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href={adaptations.cta.href} dataIntent={`Primary CTA: ${adaptations.cta.label}`} className="sm:min-w-[200px]">
              {adaptations.cta.label}
              <span aria-hidden>→</span>
            </Button>
            <Button variant="secondary" href="https://github.com/bvicsay/adaptmypage" dataIntent="Hero: View source">
              View source
            </Button>
            {adaptations.cta.variant !== "build" ? (
              <span className="font-mono text-[11px] text-ink-3">button chosen because {adaptations.cta.reason}</span>
            ) : null}
          </div>

          <div className="mt-8 flex max-w-md items-center justify-between gap-3 rounded-[10px] bg-ink px-4 py-3 text-white">
            <Code html={installHtml} className="[&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!text-[0.95rem]" />
            <CopyButton text="npm install intentflags" />
          </div>

          {adaptations.showQuickVersion ? (
            <div className="adapt-flash mt-6 max-w-xl rounded-[10px] border border-adapt/50 bg-adapt-soft p-4">
              <p className="eyebrow !text-ink-2">The 30-second version</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.95rem] text-ink-2">
                <li>Install the package and wrap your app in one provider.</li>
                <li>Add one API route; it asks Jev six questions about each visitor.</li>
                <li>
                  Write <code className="inline">if (useIntent("price_comparison").active)</code> like any other flag.
                </li>
              </ol>
              <p className="mt-2 font-mono text-[11px] text-ink-3">shown because friction {Math.round(state.friction * 100)}%</p>
            </div>
          ) : null}
        </div>

        {/* hero instrument: a compact read-out of the visitor's own state */}
        <div className="lg:pt-6">
          <div className="rounded-[12px] border border-line bg-surface p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="live-dot" aria-hidden />
                <span className="eyebrow !text-ink">This page is adapting to you</span>
              </div>
              <span className="font-mono text-[11px] text-ink-3">
                {state.meta.source === "jev" ? state.meta.model : state.meta.source === "heuristic" ? "heuristic" : state.meta.source}
              </span>
            </div>

            <dl className="mt-5 space-y-4">
              <Row label="Intent" value={evaluated ? state.intent.value : "reading…"} p={state.intent.confidence} />
              <Row label="Likely next action" value={evaluated ? state.nextAction.value : "reading…"} p={state.nextAction.confidence} />
              <Row label="Technical expertise" p={state.expertise} />
              <Row label="Purchase intent" p={state.purchaseIntent} />
              <Row label="Friction" p={state.friction} warm />
              <Row label="Abandon risk" p={state.abandonRisk} warm />
            </dl>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <p className="text-[12.5px] text-ink-3">
                {evaluated
                  ? `Judged ${state.meta.latencyMs ? `in ${state.meta.latencyMs} ms` : "just now"}${
                      typeof state.meta.costUsd === "number" ? ` for $${state.meta.costUsd.toFixed(6)}` : ""
                    }.`
                  : "First judgment arrives after a second of behavior."}
              </p>
              <button
                type="button"
                onClick={() => panel.setOpen(true)}
                data-intent="Hero: Open the panel"
                className="font-mono text-[12px] text-signal hover:underline"
              >
                Open the panel →
              </button>
            </div>
          </div>
          <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-ink-3">
            The same six judgments power this page. Read the API reference and it moves up. Hover the prices and the button changes.
            Nothing here is scripted to a click; every change follows the model’s answer.
          </p>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, p, warm }: { label: string; value?: string; p: number; warm?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-[13px] text-ink-2">{label}</dt>
        <dd className="flex items-baseline gap-2 font-mono text-[13px]">
          {value ? <span className="text-ink">{value}</span> : null}
          <Pct value={p} className={warm && p > 0.5 ? "text-live" : "text-signal"} />
        </dd>
      </div>
      <Meter value={p} className="mt-1.5" color={warm ? (p > 0.5 ? "#e63b2e" : p > 0.25 ? "#f5b518" : undefined) : undefined} />
    </div>
  );
}
