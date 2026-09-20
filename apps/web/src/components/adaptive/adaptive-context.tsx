"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAdaptations, type AdaptationEvent, type Adaptations } from "./use-adaptations";

interface PanelState {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const AdaptCtx = createContext<{ adaptations: Adaptations; log: AdaptationEvent[]; panel: PanelState } | null>(null);

export function AdaptiveProvider({ children }: { children: ReactNode }) {
  const { adaptations, log } = useAdaptations();
  const [open, setOpen] = useState(false);
  // open the panel by default on wide screens
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1280px)").matches;
    const stored = sessionStorage.getItem("if:panel");
    setOpen(stored ? stored === "1" : wide);
  }, []);
  const value = useMemo(
    () => ({
      adaptations,
      log,
      panel: {
        open,
        setOpen: (v: boolean) => {
          setOpen(v);
          try {
            sessionStorage.setItem("if:panel", v ? "1" : "0");
          } catch {}
        },
      },
    }),
    [adaptations, log, open],
  );
  return <AdaptCtx.Provider value={value}>{children}</AdaptCtx.Provider>;
}

export function useAdaptive() {
  const v = useContext(AdaptCtx);
  if (!v) throw new Error("useAdaptive must be used inside <AdaptiveProvider>");
  return v;
}
