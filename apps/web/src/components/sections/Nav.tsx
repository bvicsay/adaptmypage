"use client";

import { Wordmark } from "../brand/Logo";
import { useAdaptive } from "../adaptive/adaptive-context";

export function Nav() {
  const { panel } = useAdaptive();
  return (
    <div className="sticky top-0 z-20 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6 sm:px-10" aria-label="Main">
        <a href="#top" data-intent="Logo">
          <Wordmark />
        </a>
        <div className="flex items-center gap-6">
          <a href="#docs" className="hidden text-[0.9rem] font-medium text-ink-2 hover:text-ink sm:inline" data-intent="Nav: Docs">Docs</a>
          <a href="#pricing" className="hidden text-[0.9rem] font-medium text-ink-2 hover:text-ink sm:inline" data-intent="Nav: Pricing">Pricing</a>
          <a href="https://github.com/bvicsay/adaptmypage" className="hidden text-[0.9rem] font-medium text-ink-2 hover:text-ink sm:inline" data-intent="Nav: GitHub">GitHub</a>
          <button
            type="button"
            onClick={() => panel.setOpen(!panel.open)}
            className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-ink/25 px-3 font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink hover:border-ink"
            data-intent="Nav: Live panel"
          >
            <span className="dot is-live" aria-hidden />
            {panel.open ? "Hide panel" : "Live panel"}
          </button>
        </div>
      </nav>
    </div>
  );
}
