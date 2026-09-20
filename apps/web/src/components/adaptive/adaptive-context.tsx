"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAdaptations, type Adaptations, type Popup } from "./use-adaptations";

export interface LogEntry {
  id: number;
  at: number;
  text: string;
  why: string;
}

interface Ctx {
  adaptations: Adaptations;
  popups: Popup[];
  dismissPopup: (id: string) => void;
  log: LogEntry[];
  panel: { open: boolean; setOpen: (v: boolean) => void };
}

const AdaptCtx = createContext<Ctx | null>(null);
const SHOWN_KEY = "amp:popups";

export function AdaptiveProvider({ children }: { children: ReactNode }) {
  const adaptations = useAdaptations();
  const [popups, setPopups] = useState<Popup[]>([]);
  const shown = useRef<Set<string>>(new Set());
  const [log, setLog] = useState<LogEntry[]>([]);
  const prev = useRef<Adaptations | null>(null);
  const counter = useRef(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      shown.current = new Set(JSON.parse(sessionStorage.getItem(SHOWN_KEY) ?? "[]"));
    } catch {}
    const wide = window.matchMedia("(min-width: 1280px)").matches;
    const stored = sessionStorage.getItem("amp:panel");
    setOpen(stored ? stored === "1" : wide);
  }, []);

  // enqueue wanted pop-ups once per session, and log text changes
  useEffect(() => {
    const fresh = adaptations.wanted.filter((p) => !shown.current.has(p.id));
    if (fresh.length) {
      for (const p of fresh) shown.current.add(p.id);
      try {
        sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...shown.current]));
      } catch {}
      setPopups((q) => [...q, ...fresh]);
    }
    const p = prev.current;
    const entries: Array<Omit<LogEntry, "id" | "at">> = [];
    if (p) {
      if (p.heroPhrase.text !== adaptations.heroPhrase.text) entries.push({ text: `Headline → “This page is ${adaptations.heroPhrase.text}”`, why: adaptations.heroPhrase.why ?? "signal faded" });
      if (p.cta.label !== adaptations.cta.label) entries.push({ text: `Button → “${adaptations.cta.label}”`, why: adaptations.cta.why ?? "back to default" });
      if (p.docsLine.text !== adaptations.docsLine.text) entries.push({ text: "Docs intro rewritten", why: adaptations.docsLine.why ?? "back to default" });
      for (const f of fresh) entries.push({ text: `Pop-up: “${f.title}”`, why: f.reason ? `because Jev read ${f.reason.flag} ${Math.round(f.reason.confidence * 100)}%` : "first judgment arrived" });
    }
    prev.current = adaptations;
    if (entries.length) setLog((l) => [...entries.map((e) => ({ ...e, id: ++counter.current, at: Date.now() })), ...l].slice(0, 40));
  }, [adaptations]);

  const dismissPopup = useCallback((id: string) => setPopups((q) => q.filter((p) => p.id !== id)), []);

  const value = useMemo<Ctx>(
    () => ({
      adaptations,
      popups,
      dismissPopup,
      log,
      panel: {
        open,
        setOpen: (v: boolean) => {
          setOpen(v);
          try {
            sessionStorage.setItem("amp:panel", v ? "1" : "0");
          } catch {}
        },
      },
    }),
    [adaptations, popups, dismissPopup, log, open],
  );
  return <AdaptCtx.Provider value={value}>{children}</AdaptCtx.Provider>;
}

export function useAdaptive() {
  const v = useContext(AdaptCtx);
  if (!v) throw new Error("useAdaptive must be used inside <AdaptiveProvider>");
  return v;
}
