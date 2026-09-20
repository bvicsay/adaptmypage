"use client";

import { INTENTS, useVisitorState } from "adaptmypage";
import type { IntentId } from "adaptmypage";
import { Meter, Pct, SectionHeader } from "../ui";

export function Flags() {
  const s = useVisitorState();
  const live = s.meta.source !== "initial";
  return (
    <section id="flags" data-section="flags">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 py-28 sm:px-10 lg:grid-cols-2 lg:gap-20">
        <SectionHeader
          eyebrow="The flags"
          title={
            <>
              Flags for what you
              <br />
              <span className="serif-italic">couldn’t</span> measure.
            </>
          }
          lede="Six judgments, every few seconds, each a normal 0–1 flag. The numbers on the right are you."
        />
        <div className="card self-center p-6">
          <ul className="space-y-3">
            {(Object.keys(INTENTS) as IntentId[]).map((id) => {
              const p = s.intent.probabilities[id];
              const win = live && s.intent.value === id;
              return (
                <li key={id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
                  <code className={`font-mono text-[12.5px] ${win ? "text-ink" : "text-ink-2"}`}>{id}</code>
                  <Pct value={p} className={`text-[12px] ${win ? "text-ink" : "text-ink-3"}`} />
                  <Meter value={p} className="col-span-2 h-1 bg-ink/10" />
                </li>
              );
            })}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ink/10 pt-5 font-mono text-[12px]">
            {(
              [
                ["expertise", s.expertise],
                ["purchase_intent", s.purchaseIntent],
                ["friction", s.friction],
                ["abandon_risk", s.abandonRisk],
              ] as const
            ).map(([id, v]) => (
              <div key={id} className="flex items-center justify-between gap-3">
                <span className="text-ink-2">{id}</span>
                <Pct value={v} className="text-ink" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
