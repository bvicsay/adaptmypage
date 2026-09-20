"use client";

import { useAdaptive } from "../adaptive/adaptive-context";
import { TextSwap } from "../adaptive/TextSwap";
import { Code, CopyButton } from "../ui";

export function Hero({ installHtml }: { installHtml: string }) {
  const { adaptations: a, panel } = useAdaptive();
  return (
    <section id="hero" data-section="hero">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 pb-28 pt-20 sm:px-10 sm:pt-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="dot is-live" aria-hidden />
            Live on this page
          </p>
          <h1 className="display mt-8 text-[3.2rem] sm:text-[4.6rem] lg:text-[5.4rem] text-ink">
            This page is
            <br />
            <TextSwap as="em" text={a.heroPhrase.text} why={a.heroPhrase.why} className="serif-italic block" whyClassName="mt-3" />
          </h1>
          <p className="mt-9 max-w-md text-[1.1rem] leading-relaxed text-ink-2">
            Jev reads what a visitor is trying to do. Your React code reads it back as a feature flag.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <a href={a.cta.href} className="link-arrow" data-intent={`Primary CTA: ${a.cta.label}`}>
              <TextSwap text={a.cta.label} />
            </a>
            <button type="button" onClick={() => panel.setOpen(true)} className="link-arrow" data-intent="Hero: Watch the panel">
              Watch it judge you
            </button>
          </div>
          <p className="mt-10 font-mono text-[11.5px] tracking-[0.04em] text-ink-3">
            <TextSwap text={a.status} />
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <p className="font-mono text-[11.5px] text-ink-2">Install once. React 18+, Next.js, Remix, Vite.</p>
          <div className="mt-4 flex items-center justify-between gap-3 code-block">
            <Code html={installHtml} className="[&_pre]:!bg-transparent [&_pre]:!p-0" />
            <CopyButton text="npm install adaptmypage" />
          </div>
          <p className="mt-4 font-mono text-[11.5px] leading-relaxed text-ink-2">
            Semantic events only. No coordinates, keystrokes or field values leave the browser.
          </p>
        </div>
      </div>
    </section>
  );
}
