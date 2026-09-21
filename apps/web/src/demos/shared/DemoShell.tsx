"use client";

import { IntentFlagsProvider, createIntentFlags, useIntentActions, useIntentFlags, useVisitorState } from "adaptmypage";
import type { IntentFlagsClient } from "adaptmypage";
import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DemoConfig } from "../types";
import { postToParent, type Change } from "./bridge";
import { describeAction } from "./describe";
import { createScenarioClient } from "./scenario-client";

interface ChangesCtx {
  register: (c: Change) => void;
  changes: Change[];
  embed: boolean;
  scenarioLabel: string | null;
}
const Ctx = createContext<ChangesCtx | null>(null);
export const useChanges = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useChanges outside DemoShell");
  return v;
};

/**
 * Wraps a demo page: picks a live or scripted client, collects the changes the
 * page reports, narrates the visitor's behavior, and mirrors everything to the
 * hub when embedded.
 */
export function DemoShell({ demo, children }: { demo: DemoConfig; children: ReactNode }) {
  const params = useSearchParams();
  const scenarioId = params.get("scenario");
  const frame = params.get("frame") ?? "solo";
  const embed = params.get("embed") === "1";
  const scenario = demo.scenarios.find((s) => s.id === scenarioId) ?? null;
  const [client, setClient] = useState<IntentFlagsClient | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);

  useEffect(() => {
    const endpoint = `/api/intent/${demo.id}`;
    const path = `/demo/${demo.id}`;
    let c: IntentFlagsClient;
    if (scenario) {
      const sc = createScenarioClient(scenario, { endpoint, path, onDone: () => postToParent({ source: "amp", frame, type: "done" }) });
      c = sc;
      sc.start();
    } else {
      c = createIntentFlags({ endpoint, debug: true, initialDelayMs: 1500, debounceMs: 1500, minIntervalMs: 3000, heartbeatMs: 12000, persist: false, context: { demo: demo.id } });
    }
    setClient(c);
    const offS = c.subscribe((s) => postToParent({ source: "amp", frame, type: "state", state: s }));
    const offA = c.subscribeActions((a) => postToParent({ source: "amp", frame, type: "action", action: a }));
    postToParent({ source: "amp", frame, type: "ready" });
    return () => {
      offS();
      offA();
      c.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo.id, scenario?.id, frame]);

  const value = useMemo<ChangesCtx>(
    () => ({
      changes,
      embed,
      scenarioLabel: scenario?.label ?? null,
      register: (c) => {
        setChanges((l) => [c, ...l].slice(0, 30));
        postToParent({ source: "amp", frame, type: "change", change: c });
      },
    }),
    [changes, embed, scenario?.label, frame],
  );

  if (!client) return <div className="min-h-screen bg-white" />;
  return (
    <IntentFlagsProvider client={client}>
      <Ctx.Provider value={value}>
        <div className="demo-root min-h-screen bg-white text-[#141414]" style={{ ["--accent" as string]: demo.accent }}>
          {children}
          <Narration persona={scenario?.persona ?? null} />
          {!embed ? <StandaloneToasts /> : null}
        </div>
      </Ctx.Provider>
    </IntentFlagsProvider>
  );
}

/** A subtitle strip at the bottom of the frame: what the visitor just did, and what the page currently reads. */
function Narration({ persona }: { persona: string | null }) {
  const actions = useIntentActions(3);
  const state = useVisitorState();
  const last = [...actions].reverse().map(describeAction).find(Boolean) ?? null;
  const evaluated = state.meta.source !== "initial";
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
      <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-black/10 bg-[#141414] px-4 py-2 font-mono text-[11px] text-white shadow-lg">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4f23f]" aria-hidden />
        <span className="truncate">
          {persona ? <span className="text-white/60">{persona} · </span> : <span className="text-white/60">you · </span>}
          {last ?? "watching…"}
        </span>
        <span className="hidden shrink-0 text-white/60 sm:inline">|</span>
        <span className="hidden shrink-0 sm:inline">
          {evaluated ? (
            <>
              reading: {state.intent.value} <span className="text-[#d4f23f]">{Math.round(state.intent.confidence * 100)}%</span>
            </>
          ) : (
            "reading: waiting for behavior"
          )}
        </span>
      </div>
    </div>
  );
}

function StandaloneToasts() {
  const { changes } = useChanges();
  const latest = changes[0];
  const [visible, setVisible] = useState<Change | null>(null);
  useEffect(() => {
    if (!latest) return;
    setVisible(latest);
    const t = setTimeout(() => setVisible(null), 9000);
    return () => clearTimeout(t);
  }, [latest]);
  if (!visible) return null;
  return (
    <div className="fixed right-3 top-3 z-40 w-[320px] rounded-lg border border-black/10 bg-white p-3 shadow-xl" style={{ animation: "popup-in 500ms cubic-bezier(0.22,1,0.36,1) both" }}>
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-black/50">The page just changed</p>
      <p className="mt-1 text-[14px] font-semibold">{visible.what}</p>
      <p className="mt-1 font-mono text-[11px] text-black/60">
        Detected {visible.flag} {Math.round(visible.confidence * 100)}%{visible.evidence.length ? ` · because the visitor ${visible.evidence[0]}` : ""}
      </p>
    </div>
  );
}

/**
 * Report a change when a flag-driven block turns on. Call it next to the flag
 * that drives the block; it fires once per rising edge.
 */
export function useAdaptation(active: boolean, spec: { what: string; detail?: string; flag: string; code: string }) {
  const { register } = useChanges();
  const client = useIntentFlags();
  const state = useVisitorState();
  const was = useRef(false);
  useEffect(() => {
    if (active && !was.current && state.meta.source !== "initial") {
      const confidence = state.flags[spec.flag] ?? 0;
      register({
        id: `${spec.flag}-${Date.now()}`,
        at: Date.now(),
        what: spec.what,
        ...(spec.detail ? { detail: spec.detail } : {}),
        flag: spec.flag,
        confidence,
        evidence: describeEvidence(client?.getActions() ?? [], spec.flag),
        code: spec.code,
      });
    }
    was.current = active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

import { describeEvidence } from "./describe";
