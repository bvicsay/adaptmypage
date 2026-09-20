"use client";

import { useVisitorState } from "intentflags";
import { useEffect, useState } from "react";
import { useAdaptive } from "../adaptive/adaptive-context";

/** Appears once, only when abandon_risk crosses 0.6. Not on mouse position. */
export function ExitBar() {
  const { adaptations } = useAdaptive();
  const state = useVisitorState();
  const [dismissed, setDismissed] = useState(false);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (adaptations.showExitBar) setShown(true);
  }, [adaptations.showExitBar]);
  if (!shown || dismissed) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 xl:pr-[calc(380px+1rem)]" role="region" aria-label="Before you go">
      <div className="adapt-flash mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-[12px] border border-adapt/60 bg-surface px-4 py-3 shadow-panel">
        <div>
          <p className="text-[14px] text-ink">Leaving? Take the launch email with you.</p>
          <p className="font-mono text-[11px] text-ink-3">shown because abandon_risk {Math.round(state.abandonRisk * 100)}%</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="#subscribe" data-intent="Exit bar: Get the email" onClick={() => setDismissed(true)} className="rounded-[8px] bg-ink px-3 py-2 text-[13px] text-white hover:bg-ink-2">
            Get the email
          </a>
          <button type="button" onClick={() => setDismissed(true)} data-intent="Exit bar: Dismiss" className="rounded-[8px] px-2 py-2 text-[13px] text-ink-3 hover:text-ink">
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
