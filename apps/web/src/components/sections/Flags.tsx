"use client";

import { INTENTS, NEXT_ACTIONS, useVisitorState } from "intentflags";
import type { IntentId, NextActionId } from "intentflags";
import { Meter, Pct, SectionHeader } from "../ui";

const SCALARS = [
  ["expertise", "Technical expertise", "0 = non-technical, 1 = senior engineer. Simplify or deepen examples, choose which docs tab opens first."],
  ["friction", "Friction", "0 = smooth, 1 = stuck. Show a shorter explanation, surface help, or stop showing things."],
  ["purchase_intent", "Purchase intent", "0 = none, 1 = imminent. Switch a “Learn more” button to “Start trial”."],
  ["abandon_risk", "Abandon risk", "Probability of leaving within ~30 s without acting. Gate an exit offer on it instead of on mouse position."],
] as const;

export function Flags() {
  const state = useVisitorState();
  const evaluated = state.meta.source !== "initial";
  return (
    <section id="flags" data-section="flags" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHeader
          eyebrow="Intent flags"
          title="Flags for things you couldn’t measure before."
          lede={
            <>
              Every id below is a real flag you can pass to <code className="inline">useIntent()</code> or{" "}
              <code className="inline">&lt;Intent when=…&gt;</code>. The right-hand column is your own live reading.
            </>
          }
        />

        <div className="mt-10 overflow-hidden rounded-[12px] border border-line bg-surface">
          <Table title="visitor.intent" hint="choice · one wins, all carry a probability">
            {(Object.keys(INTENTS) as IntentId[]).map((id) => (
              <RowT key={id} id={id} label={INTENTS[id].label} desc={INTENTS[id].description} p={state.intent.probabilities[id]} win={evaluated && state.intent.value === id} />
            ))}
          </Table>
          <Table title="visitor.nextAction" hint="choice · exposed as next:<id>">
            {(Object.keys(NEXT_ACTIONS) as NextActionId[]).map((id) => (
              <RowT key={id} id={`next:${id}`} label={NEXT_ACTIONS[id].label} desc={NEXT_ACTIONS[id].description} p={state.nextAction.probabilities[id]} win={evaluated && state.nextAction.value === id} />
            ))}
          </Table>
          <Table title="scalars" hint="score / yes-no · 0..1">
            {SCALARS.map(([id, label, desc]) => (
              <RowT key={id} id={id} label={label} desc={desc} p={state.flags[id] ?? 0} />
            ))}
          </Table>
        </div>
        <p className="mt-4 text-[13px] text-ink-3">
          Need a flag that isn’t here? Add a question on the server — <a href="#docs-custom" className="text-signal hover:underline">custom questions</a> show up in the same map.
        </p>
      </div>
    </section>
  );
}

function Table({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line last:border-b-0">
      <div className="flex items-baseline justify-between bg-paper px-5 py-2.5">
        <span className="font-mono text-[12.5px] text-ink">{title}</span>
        <span className="font-mono text-[11px] text-ink-3">{hint}</span>
      </div>
      <ul>{children}</ul>
    </div>
  );
}

function RowT({ id, label, desc, p, win }: { id: string; label: string; desc: string; p: number; win?: boolean }) {
  return (
    <li className={`grid gap-3 border-t border-line px-5 py-3.5 sm:grid-cols-[210px_1fr_180px] sm:items-center ${win ? "bg-signal-soft/50" : ""}`}>
      <div>
        <code className="font-mono text-[13px] text-ink">{id}</code>
        <div className="text-[12px] text-ink-3">{label}</div>
      </div>
      <p className="text-[13.5px] leading-snug text-ink-2">{desc}</p>
      <div className="flex items-center gap-3">
        <Meter value={p} className="flex-1" />
        <Pct value={p} className={`w-10 text-right text-[12.5px] ${win ? "text-signal" : "text-ink-3"}`} />
      </div>
    </li>
  );
}
