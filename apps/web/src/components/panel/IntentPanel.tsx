"use client";

import { INTENTS, NEXT_ACTIONS, useIntentDebug } from "intentflags";
import type { Action, IntentId, NextActionId } from "intentflags";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAdaptive } from "../adaptive/adaptive-context";
import { Meter, Pct, heat } from "../ui";

const ICON: Partial<Record<Action["type"], string>> = {
  pageview: "◎",
  navigate: "→",
  section_enter: "▤",
  section_exit: "▥",
  scroll_return: "↺",
  click: "●",
  hover: "◌",
  hesitation: "…",
  scroll: "↓",
  copy: "⧉",
  select_text: "▬",
  form_focus: "▭",
  form_input: "▮",
  form_submit: "✓",
  tab_hidden: "◐",
  tab_visible: "◑",
  exit_intent: "↑",
  rage_click: "‼",
  idle: "◦",
  resume: "•",
  custom: "★",
};

function sortEntries<T extends string>(p: Record<T, number>): Array<[T, number]> {
  return (Object.entries(p) as Array<[T, number]>).sort((a, b) => b[1] - a[1]);
}

export function IntentPanel() {
  const { state, actions, lastResponse, evaluating, evaluate } = useIntentDebug();
  const { log, panel } = useAdaptive();
  const [tab, setTab] = useState<"state" | "events" | "exchange">("state");
  const eventsRef = useRef<HTMLOListElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (tab === "events" && eventsRef.current) eventsRef.current.scrollTop = 0;
  }, [actions.length, tab]);

  const intents = useMemo(() => sortEntries<IntentId>(state.intent.probabilities), [state]);
  const nexts = useMemo(() => sortEntries<NextActionId>(state.nextAction.probabilities), [state]);
  const ago = state.meta.evaluatedAt ? Math.max(0, Math.round((Date.now() - state.meta.evaluatedAt) / 1000)) : null;
  void tick;

  const source = state.meta.source;
  const sourceLabel =
    source === "jev" ? `Jev · ${state.meta.model ?? "jev"}` : source === "heuristic" ? "Heuristic (no Jev key)" : source === "cached" ? "Cached from this session" : "Waiting for first judgment";

  return (
    <aside
      aria-label="Live visitor state"
      className="flex h-full flex-col bg-surface text-ink"
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="live-dot" aria-hidden />
            <span className="eyebrow !text-ink">Live visitor state</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-ink-3">
            {sourceLabel}
            {state.meta.latencyMs ? ` · ${state.meta.latencyMs} ms` : ""}
            {typeof state.meta.costUsd === "number" ? ` · $${state.meta.costUsd.toFixed(6)}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => panel.setOpen(false)}
          className="rounded-md p-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink"
          aria-label="Close panel"
          data-intent="Close live panel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </header>

      <nav className="flex border-b border-line px-2" aria-label="Panel sections">
        {(
          [
            ["state", "State"],
            ["events", `Events · ${actions.length}`],
            ["exchange", "Model exchange"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            data-intent={`Panel tab: ${label}`}
            className={`-mb-px border-b-2 px-3 py-2 font-mono text-[11.5px] ${tab === id ? "border-signal text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="thin-scroll flex-1 overflow-y-auto">
        {tab === "state" ? (
          <div className="space-y-6 px-4 py-4">
            <section>
              <div className="flex items-baseline justify-between">
                <h3 className="eyebrow">Intent</h3>
                <span className="font-mono text-[11px] text-ink-3">{ago === null ? "" : `judged ${ago}s ago`}</span>
              </div>
              <ul className="mt-2 space-y-2">
                {intents.map(([id, p]) => {
                  const win = id === state.intent.value && source !== "initial";
                  return (
                    <li key={id}>
                      <div className="flex items-baseline justify-between text-[12.5px]">
                        <span className={`font-mono ${win ? "text-ink font-medium" : "text-ink-2"}`}>{id}</span>
                        <Pct value={p} className={win ? "text-signal" : "text-ink-3"} />
                      </div>
                      <Meter value={p} className="mt-1" />
                      {win ? <p className="mt-1 text-[11.5px] leading-snug text-ink-3">{INTENTS[id].description}</p> : null}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h3 className="eyebrow">Likely next action</h3>
              <ul className="mt-2 grid grid-cols-1 gap-1.5">
                {nexts.map(([id, p]) => (
                  <li key={id} className="flex items-center gap-2 text-[12px]">
                    <span className="w-[42%] truncate font-mono text-ink-2" title={NEXT_ACTIONS[id].description}>
                      {id}
                    </span>
                    <Meter value={p} className="flex-1" height="h-1" />
                    <Pct value={p} className="w-9 text-right text-ink-3" />
                  </li>
                ))}
              </ul>
            </section>

            <section className="grid grid-cols-2 gap-3">
              {(
                [
                  ["expertise", "Technical expertise", state.expertise],
                  ["purchase_intent", "Purchase intent", state.purchaseIntent],
                  ["friction", "Friction", state.friction],
                  ["abandon_risk", "Abandon risk", state.abandonRisk],
                ] as const
              ).map(([id, label, v]) => (
                <div key={id} className="rounded-[8px] border border-line p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11.5px] text-ink-2">{label}</span>
                    <Pct value={v} className="text-[12px]" />
                  </div>
                  <Meter value={v} className="mt-2" color={id === "friction" || id === "abandon_risk" ? mix(v) : heat(v)} />
                  <div className="mt-1 font-mono text-[10.5px] text-ink-3">{id}</div>
                </div>
              ))}
            </section>

            <section>
              <h3 className="eyebrow">Page adaptations</h3>
              {log.length === 0 ? (
                <p className="mt-2 text-[12px] text-ink-3">Nothing yet. Read the docs, hover the prices, copy some code — the page reacts to the judgment, not to the click.</p>
              ) : (
                <ol className="mt-2 space-y-2">
                  {log.map((e) => (
                    <li key={e.id} className="rounded-[8px] border-l-2 border-adapt bg-adapt-soft/60 px-3 py-2">
                      <div className="text-[12.5px] text-ink">{e.text}</div>
                      <div className="mt-0.5 font-mono text-[10.5px] text-ink-3">because {e.reason}</div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        ) : null}

        {tab === "events" ? (
          <ol ref={eventsRef} className="px-2 py-2" aria-live="polite">
            {actions.length === 0 ? <li className="px-2 py-3 text-[12px] text-ink-3">No events yet.</li> : null}
            {actions
              .slice()
              .reverse()
              .map((a, i) => (
                <li key={`${a.t}-${i}`} className="flex gap-2 rounded px-2 py-1 font-mono text-[11.5px] hover:bg-paper-2">
                  <span className="w-11 shrink-0 text-right tabular-nums text-ink-3">{a.t.toFixed(1)}s</span>
                  <span className="w-4 shrink-0 text-center text-signal" aria-hidden>
                    {ICON[a.type] ?? "·"}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-ink">{a.type}</span>
                    {a.target ? <span className="text-ink-2"> {a.target}</span> : null}
                    {a.detail ? <span className="text-ink-3"> ({a.detail})</span> : null}
                  </span>
                </li>
              ))}
          </ol>
        ) : null}

        {tab === "exchange" ? (
          <div className="space-y-4 px-4 py-4 text-[12px]">
            {!lastResponse?.debug ? (
              <p className="text-ink-3">The first judgment has not come back yet.</p>
            ) : (
              <>
                <Exchange title="Provider" body={lastResponse.debug.provider} />
                <Exchange title="State sent to the model" json={lastResponse.debug.state} open />
                <Exchange title="Questions" json={lastResponse.debug.questions} />
                <Exchange title="Raw answers" json={lastResponse.debug.answers} open />
                <Exchange
                  title="Usage"
                  body={
                    lastResponse.debug.usage
                      ? `${lastResponse.debug.usage.inputTokens} input tokens · ${lastResponse.debug.usage.outputTokens} output · ≈ $${(
                          lastResponse.debug.usage.inputTokens * 0.042e-6
                        ).toFixed(7)} at Jev list price`
                      : "not reported"
                  }
                />
              </>
            )}
          </div>
        ) : null}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <button
          type="button"
          onClick={() => void evaluate()}
          disabled={evaluating}
          data-intent="Judge now"
          className="rounded-md bg-ink px-3 py-1.5 font-mono text-[11.5px] text-white hover:bg-ink-2 disabled:opacity-50"
        >
          {evaluating ? "Judging…" : "Judge now"}
        </button>
        <button
          type="button"
          data-intent="Reset session"
          onClick={() => {
            try {
              sessionStorage.clear();
              localStorage.removeItem("if:vid");
              localStorage.removeItem("if:visits");
            } catch {}
            location.reload();
          }}
          className="font-mono text-[11.5px] text-ink-3 hover:text-ink"
        >
          Reset session
        </button>
      </footer>
    </aside>
  );
}

function mix(v: number) {
  // friction / abandon: grey → amber → red
  const t = Math.max(0, Math.min(1, v));
  if (t < 0.5) return lerp([0xc9, 0xd2, 0xe6], [0xf5, 0xb5, 0x18], t / 0.5);
  return lerp([0xf5, 0xb5, 0x18], [0xe6, 0x3b, 0x2e], (t - 0.5) / 0.5);
}
function lerp(a: number[], b: number[], t: number) {
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function Exchange({ title, json, body, open }: { title: string; json?: unknown; body?: string; open?: boolean }) {
  return (
    <details open={open} className="group rounded-[8px] border border-line">
      <summary className="cursor-pointer select-none px-3 py-2 font-mono text-[11px] text-ink-2 group-open:border-b group-open:border-line">
        {title}
      </summary>
      {json !== undefined ? (
        <pre className="thin-scroll max-h-72 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-2">
          {JSON.stringify(json, null, 2)}
        </pre>
      ) : (
        <p className="px-3 py-2 font-mono text-[11px] text-ink-2">{body}</p>
      )}
    </details>
  );
}
