"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAdaptive } from "./adaptive-context";
import { SECTION_LABELS, type SectionId } from "./use-adaptations";

/**
 * Renders the page sections in the live order. Uses CSS `order` so React
 * never remounts a section (forms keep their state), and the View Transitions
 * API when the browser has it so the move is visible.
 */
export function AdaptiveSections({ sections }: { sections: Record<SectionId, ReactNode> }) {
  const { adaptations } = useAdaptive();
  const lastOrder = useRef(adaptations.order.join());
  const flash = useRef<Set<SectionId>>(new Set());

  useEffect(() => {
    const key = adaptations.order.join();
    if (key === lastOrder.current) return;
    lastOrder.current = key;
    flash.current = new Set(Object.keys(adaptations.moved) as SectionId[]);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    // the reorder already happened in React; a view transition here only smooths repaint
    doc.startViewTransition?.(() => {});
    for (const id of flash.current) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.classList.remove("adapt-flash");
      void el.offsetWidth;
      el.classList.add("adapt-flash");
    }
  }, [adaptations.order, adaptations.moved]);

  return (
    <div className="flex flex-col">
      {(Object.keys(sections) as SectionId[]).map((id) => {
        const idx = adaptations.order.indexOf(id);
        const reason = adaptations.moved[id];
        return (
          <div
            key={id}
            className="section-slot"
            style={{ order: idx, ["--vt-name" as string]: `sec-${id}` }}
            data-moved={reason ? "true" : undefined}
          >
            {reason ? (
              <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-8 -mb-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-adapt-soft border border-adapt/40 px-3 py-1 font-mono text-[11px] text-ink-2">
                  <span aria-hidden>↑</span> {SECTION_LABELS[id]} moved up · {reason}
                </span>
              </div>
            ) : null}
            {sections[id]}
          </div>
        );
      })}
    </div>
  );
}
