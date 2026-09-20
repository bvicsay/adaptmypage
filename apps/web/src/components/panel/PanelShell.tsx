"use client";

import { useVisitorState } from "intentflags";
import type { ReactNode } from "react";
import { useAdaptive } from "../adaptive/adaptive-context";
import { IntentPanel } from "./IntentPanel";

const WIDTH = 380;

/** Lays the page out beside the live panel; overlays it on narrow screens. */
export function PanelShell({ children }: { children: ReactNode }) {
  const { panel } = useAdaptive();
  const state = useVisitorState();
  const evaluated = state.meta.source !== "initial";

  return (
    <>
      <div
        className="min-h-screen transition-[padding] duration-300 ease-out"
        style={{ paddingRight: panel.open ? `var(--panel-pad, 0px)` : 0 }}
      >
        <style>{`@media (min-width: 1280px) { :root { --panel-pad: ${WIDTH}px; } }`}</style>
        {children}
      </div>

      {/* backdrop on narrow screens */}
      {panel.open ? (
        <button
          type="button"
          aria-label="Close panel"
          onClick={() => panel.setOpen(false)}
          className="fixed inset-0 z-30 bg-ink/30 xl:hidden"
        />
      ) : null}

      <div
        className={`fixed inset-y-0 right-0 z-40 w-[min(100vw,380px)] border-l border-line shadow-panel transition-transform duration-300 ease-out ${
          panel.open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: `min(100vw, ${WIDTH}px)` }}
        aria-hidden={!panel.open}
      >
        <IntentPanel />
      </div>

      {!panel.open ? (
        <button
          type="button"
          onClick={() => panel.setOpen(true)}
          data-intent="Open live panel"
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-full border border-line-2 bg-surface px-3.5 py-2 shadow-panel hover:border-ink-3"
        >
          <span className="live-dot" aria-hidden />
          <span className="font-mono text-[12px] text-ink">
            {evaluated ? (
              <>
                {state.intent.value} <span className="text-signal">{Math.round(state.intent.confidence * 100)}%</span>
              </>
            ) : (
              "live visitor state"
            )}
          </span>
        </button>
      ) : null}
    </>
  );
}
