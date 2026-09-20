"use client";

import type { Action, VisitorState } from "adaptmypage";
import { useEffect, useMemo, useRef, useState } from "react";
import { onFrameMessage, type Change } from "@/demos/shared/bridge";
import { describeAction } from "@/demos/shared/describe";
import type { DemoConfig } from "@/demos/types";
import { Code } from "../ui";

const LIVE = "live";

export function DemoCompare({ demo, routeHtml, clientHtml }: { demo: DemoConfig; routeHtml: string; clientHtml: string }) {
  const first = demo.scenarios[0]?.id ?? LIVE;
  const second = demo.scenarios[1]?.id ?? LIVE;
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Pane demo={demo} frame="a" initial={first} />
        <Pane demo={demo} frame="b" initial={second} />
      </div>

      <section className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow flex items-center gap-2"><span className="dot" aria-hidden />How it’s wired</p>
          <h2 className="display mt-4 text-[2rem] sm:text-[2.6rem]">Two files.<br /><span className="serif-italic">Real</span> judgments.</h2>
          <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-ink-2">
            The route declares what this site cares about as typed questions. Jev answers them from the visitor’s behavior every few seconds. The page reads the answers as flags. Every change you saw above came from a line like the ones on the right.
          </p>
          <a href={`/demo/${demo.id}/frame`} target="_blank" rel="noreferrer" className="link-arrow mt-6" data-intent="Open the page full-screen">Open this page full-screen and be the visitor</a>
        </div>
        <div className="grid gap-4">
          <div className="card p-4"><p className="font-mono text-[11.5px] text-ink-2">app/api/intent/route.ts</p><Code html={routeHtml} className="mt-2" /></div>
          <div className="card p-4"><p className="font-mono text-[11.5px] text-ink-2">the page</p><Code html={clientHtml} className="mt-2" /></div>
        </div>
      </section>
    </div>
  );
}

function Pane({ demo, frame, initial }: { demo: DemoConfig; frame: string; initial: string }) {
  const [scenario, setScenario] = useState(initial);
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<VisitorState | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [last, setLast] = useState<Action | null>(null);
  const [done, setDone] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    return onFrameMessage((m) => {
      if (m.frame !== frame) return;
      if (m.type === "state") setState(m.state);
      if (m.type === "change") setChanges((l) => [m.change, ...l].slice(0, 12));
      if (m.type === "action") setLast(m.action);
      if (m.type === "done") setDone(true);
      if (m.type === "ready") {
        setState(null);
        setChanges([]);
        setLast(null);
        setDone(false);
      }
    });
  }, [frame]);

  const src = useMemo(() => {
    const p = new URLSearchParams({ frame, embed: "1", k: String(nonce) });
    if (scenario !== LIVE) p.set("scenario", scenario);
    return `/demo/${demo.id}/frame?${p}`;
  }, [demo.id, frame, scenario, nonce]);

  const persona = demo.scenarios.find((s) => s.id === scenario);
  const evaluated = state && state.meta.source !== "initial";
  const lastText = last ? describeAction(last) : null;

  return (
    <section className="flex flex-col" aria-label={`Visitor ${frame.toUpperCase()}`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">Visitor {frame.toUpperCase()}</span>
          <select
            value={scenario}
            onChange={(e) => { setScenario(e.target.value); setNonce((n) => n + 1); }}
            data-intent={`Scenario ${frame}`}
            className="rounded-[6px] border border-ink/25 bg-surface px-2.5 py-1.5 text-[13px] font-semibold text-ink"
          >
            {demo.scenarios.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            <option value={LIVE}>You, live</option>
          </select>
          <button type="button" onClick={() => setNonce((n) => n + 1)} className="rounded-[6px] border border-ink/25 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink hover:border-ink" data-intent={`Replay ${frame}`}>
            {done ? "Replay" : "Restart"}
          </button>
        </div>
        <div className="font-mono text-[11.5px] text-ink-2">
          {evaluated ? (
            <>
              Jev: <span className="text-ink">{state!.intent.value}</span> {Math.round(state!.intent.confidence * 100)}%
            </>
          ) : (
            <span className="text-ink-3">Jev: waiting for behavior…</span>
          )}
        </div>
      </header>
      <p className="mt-1.5 min-h-[1.2rem] text-[12.5px] text-ink-2">
        {persona ? persona.persona : "Scroll, hover and click inside the frame. The page judges you every few seconds."}
      </p>

      <div className="card mt-3 overflow-hidden rounded-[8px] p-1.5">
        <iframe
          key={src}
          src={src}
          title={`${demo.brand} — visitor ${frame}`}
          className="h-[520px] w-full rounded-[6px] bg-white sm:h-[600px]"
          loading="eager"
        />
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-ink-3">
        <span className="truncate">{lastText ? `▸ ${lastText}` : "▸ …"}</span>
        <span>{changes.length} change{changes.length === 1 ? "" : "s"}</span>
      </div>

      <ol ref={listRef} className="mt-2 space-y-2" aria-live="polite">
        {changes.length === 0 ? (
          <li className="rounded-[8px] border border-dashed border-ink/20 px-4 py-3 text-[12.5px] text-ink-3">Nothing has changed yet. Changes appear here with the judgment and the behavior that caused them.</li>
        ) : null}
        {changes.map((c) => (
          <li key={c.id} className="popup !p-4" style={{ animationDuration: "500ms" }}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[14px] font-semibold leading-snug text-ink">{c.what}</p>
              <span className="shrink-0 font-mono text-[11px] text-ink-3">{new Date(c.at).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })}</span>
            </div>
            {c.detail ? <p className="mt-1 text-[12.5px] text-ink-2">{c.detail}</p> : null}
            <div className="mt-2.5 rounded-[6px] bg-card px-3 py-2">
              <div className="flex items-baseline justify-between font-mono text-[11px]">
                <span className="text-ink-2">Jev read <span className="text-ink">{c.flag}</span></span>
                <span className="text-ink">{Math.round(c.confidence * 100)}%</span>
              </div>
              <div className="meter mt-1 h-1 rounded-full bg-ink/10"><i style={{ width: `${Math.round(c.confidence * 100)}%`, backgroundColor: "var(--ink)" }} /></div>
              {c.evidence.length ? <p className="mt-1.5 text-[12px] text-ink-2">because the visitor {c.evidence.join(", ")}</p> : null}
            </div>
            <pre className="mt-2 overflow-x-auto rounded-[4px] bg-[var(--code-bg)] px-3 py-2 font-mono text-[11px] leading-relaxed text-[var(--code-fg)]">{c.code}</pre>
          </li>
        ))}
      </ol>
    </section>
  );
}
