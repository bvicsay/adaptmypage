"use client";

import { useEffect, useRef, useState } from "react";
import type { Popup } from "./use-adaptations";
import { useAdaptive } from "./adaptive-context";

const DURATION_MS = 16000;

/**
 * One card at a time, bottom-left. Each card says what changed, why the model
 * thinks so (flag + confidence + the behavior that drove it), and what to do.
 */
export function Popups() {
  const { popups, dismissPopup, panel } = useAdaptive();
  const current = popups[0] ?? null;
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!current) return;
    setLeaving(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => close(current.id), DURATION_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  function close(id: string) {
    setLeaving(true);
    setTimeout(() => {
      dismissPopup(id);
      setLeaving(false);
    }, 320);
  }

  if (!current) return null;
  const r = current.reason;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-start px-4 pb-4 sm:px-6 sm:pb-6 xl:pr-[calc(380px+1.5rem)]" aria-live="polite">
      <article
        key={current.id}
        className={`popup pointer-events-auto w-full max-w-[420px] ${leaving ? "is-leaving" : ""}`}
        role="status"
      >
        <div className="popup-progress" style={{ animationDuration: `${DURATION_MS}ms` }} aria-hidden />
        <header className="flex items-start justify-between gap-3">
          <p className="eyebrow flex items-center gap-2">
            <span className="dot" aria-hidden />
            {current.kind === "welcome" ? "How this page works" : "The page just changed"}
          </p>
          <button type="button" onClick={() => close(current.id)} className="-mr-1 -mt-1 rounded p-1 text-ink-3 hover:text-ink" aria-label="Dismiss" data-intent={`Dismiss popup: ${current.title}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </header>

        <h3 className="display mt-3 text-[1.5rem] leading-[1.05]">{current.title}</h3>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{current.body}</p>

        {r ? (
          <div className="mt-4 rounded-[8px] bg-card p-3">
            <div className="flex items-baseline justify-between font-mono text-[11.5px]">
              <span className="text-ink-2">
                Jev read <span className="text-ink">{r.flag}</span>
              </span>
              <span className="text-ink">{Math.round(r.confidence * 100)}%</span>
            </div>
            <div className="meter mt-1.5 h-1 rounded-full bg-ink/10">
              <i style={{ width: `${Math.round(r.confidence * 100)}%`, backgroundColor: "var(--ink)" }} />
            </div>
            {r.evidence.length ? (
              <p className="mt-2 text-[12.5px] leading-snug text-ink-2">
                because you {r.evidence.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-4">
          {current.action ? (
            current.action.href === "#panel" ? (
              <button type="button" className="link-arrow" data-intent={`Popup: ${current.action.label}`} onClick={() => { panel.setOpen(true); close(current.id); }}>
                {current.action.label}
              </button>
            ) : (
              <a href={current.action.href} className="link-arrow" data-intent={`Popup: ${current.action.label}`} onClick={() => close(current.id)}>
                {current.action.label}
              </a>
            )
          ) : null}
          <button type="button" onClick={() => close(current.id)} className="text-[13px] text-ink-3 hover:text-ink" data-intent="Popup: Not now">
            Not now
          </button>
        </div>
      </article>
    </div>
  );
}
