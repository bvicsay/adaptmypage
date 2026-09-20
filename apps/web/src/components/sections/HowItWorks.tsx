"use client";

import { useIntentActions } from "intentflags";
import { Code, SectionHeader } from "../ui";

export function HowItWorks({ questionHtml, actHtml }: { questionHtml: string; actHtml: string }) {
  const actions = useIntentActions(8);
  return (
    <section id="how" data-section="how" className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="Observe. Judge. Act. The model only does the middle step."
          lede="Jev is a decision model, not a text generator. It reads one state, answers typed questions in a single 70–500 ms pass, and returns probabilities. There is nothing to parse and nothing that can hallucinate a shape."
        />
        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          <Step n="1" title="Observe" body="The SDK listens for meaning, not coordinates: sections entering the viewport, dwell time, hovers over controls, copied code, form activity, exit intent, rage clicks. Your own events, right now:">
            <ul className="mt-3 space-y-1 rounded-[8px] border border-line bg-paper p-3 font-mono text-[11.5px] text-ink-2">
              {actions.length === 0 ? <li className="text-ink-3">waiting for behavior…</li> : null}
              {actions.map((a, i) => (
                <li key={i} className="truncate">
                  <span className="text-ink-3">{a.t.toFixed(1)}s</span> {a.type}
                  {a.target ? ` ${a.target}` : ""}
                  {a.detail ? <span className="text-ink-3"> ({a.detail})</span> : null}
                </li>
              ))}
            </ul>
          </Step>
          <Step n="2" title="Judge" body="Every few seconds the compact snapshot goes to one route. Jev answers six typed questions against it — a choice, a scale, a yes/no — and returns the full distribution for each.">
            <Code html={questionHtml} className="mt-3 [&_pre]:!text-[11.5px]" />
          </Step>
          <Step n="3" title="Act" body="Your code reads the answer like any flag. Thresholds, ordering, fallbacks and A/B logic stay in TypeScript, where you can test them.">
            <Code html={actHtml} className="mt-3 [&_pre]:!text-[11.5px]" />
          </Step>
        </ol>
      </div>
    </section>
  );
}

function Step({ n, title, body, children }: { n: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <li className="flex flex-col rounded-[12px] border border-line p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-mono text-[12px] text-white">{n}</span>
        <h3 className="display text-[1.35rem]">{title}</h3>
      </div>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-2">{body}</p>
      <div className="mt-auto">{children}</div>
    </li>
  );
}
