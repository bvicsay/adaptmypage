"use client";

import { useIntentActions } from "adaptmypage";
import { SectionHeader } from "../ui";

export function How() {
  const actions = useIntentActions(6);
  return (
    <section id="how" data-section="how" className="band">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 py-28 sm:px-10 lg:grid-cols-2 lg:gap-20">
        <SectionHeader
          eyebrow="How it works"
          title={
            <>
              Watch. Ask Jev.
              <br />
              <span className="serif-italic">Change</span> the page.
            </>
          }
          lede="No generated text. Jev answers six typed questions about the visitor in one 300 ms pass and returns probabilities. Your code decides what to do with them."
        />
        <div className="grid gap-4 self-center">
          {[
            ["01", "Watch", "Sections read, code copied, prices hovered."],
            ["02", "Ask Jev", "intent · next action · expertise · friction · purchase intent · abandon risk"],
            ["03", "Change", "useIntent(\"price_comparison\").active"],
          ].map(([n, t, d]) => (
            <div key={n} className="flex items-baseline gap-5 border-t border-ink/15 pt-4">
              <span className="font-mono text-[11px] text-ink-3">{n}</span>
              <span className="display w-24 shrink-0 text-[1.25rem]">{t}</span>
              <span className="font-mono text-[12px] leading-relaxed text-ink-2">{d}</span>
            </div>
          ))}
          <div className="card mt-2 p-4">
            <p className="eyebrow">Your last events</p>
            <ul className="mt-2 space-y-1 font-mono text-[11.5px] text-ink-2">
              {actions.length === 0 ? <li className="text-ink-3">waiting…</li> : null}
              {actions.map((x, i) => (
                <li key={i} className="truncate">
                  <span className="text-ink-3">{x.t.toFixed(1)}s</span> {x.type}
                  {x.target ? ` ${x.target}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
