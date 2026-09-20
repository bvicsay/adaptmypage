"use client";

import { Wordmark } from "../brand/Logo";
import { useAdaptive } from "../adaptive/adaptive-context";

const LINKS = [
  ["#how", "How it works"],
  ["#flags", "Intent flags"],
  ["#docs", "Docs"],
  ["#pricing", "Pricing"],
  ["#faq", "FAQ"],
] as const;

export function Nav() {
  const { panel } = useAdaptive();
  return (
    <div className="sticky top-0 z-20 border-b border-line/80 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8" aria-label="Main">
        <a href="#top" className="text-ink" data-intent="Logo">
          <Wordmark />
        </a>
        <ul className="hidden items-center gap-6 md:flex">
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <a href={href} className="text-[0.9rem] text-ink-2 hover:text-ink" data-intent={`Nav: ${label}`}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/bvicsay/adaptmypage"
            className="hidden h-9 items-center rounded-[8px] px-3 text-[0.9rem] text-ink-2 hover:bg-paper-2 hover:text-ink sm:inline-flex"
            data-intent="Nav: GitHub"
          >
            GitHub
          </a>
          <button
            type="button"
            onClick={() => panel.setOpen(!panel.open)}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-line-2 bg-surface px-3 font-mono text-[12px] text-ink hover:border-ink-3"
            data-intent="Nav: Live panel"
          >
            <span className="live-dot" aria-hidden />
            {panel.open ? "Hide panel" : "Live panel"}
          </button>
        </div>
      </nav>
    </div>
  );
}
