import Link from "next/link";
import { Code, CopyButton } from "../ui";

export function Hero({ installHtml }: { installHtml: string }) {
  return (
    <section id="hero">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 pb-24 pt-20 sm:px-10 sm:pt-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
        <div>
          <p className="eyebrow flex items-center gap-2"><span className="dot" aria-hidden />Semantic feature flags for websites</p>
          <h1 className="display mt-8 text-[3rem] sm:text-[4.2rem] lg:text-[4.8rem] text-ink">
            Change your website live to match what each visitor <span className="serif-italic">wants</span>.
          </h1>
          <p className="mt-8 max-w-md text-[1.1rem] leading-relaxed text-ink-2">
            adaptmypage reads what a visitor is trying to do. Your React code reads it back as a flag and changes the page. Open source.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link href="/demo/pricing" className="link-arrow" data-intent="Hero: See the demos">See four pages change live</Link>
            <a href="#install" className="link-arrow" data-intent="Hero: Install">Install</a>
          </div>
        </div>
        <div id="install" className="card p-6 sm:p-8">
          <p className="font-mono text-[11.5px] text-ink-2">Install once. React 18+, Next.js, Remix, Vite.</p>
          <div className="code-block mt-4 flex items-center justify-between gap-3">
            <Code html={installHtml} className="[&_pre]:!bg-transparent [&_pre]:!p-0" />
            <CopyButton text="npm install adaptmypage" />
          </div>
          <p className="mt-4 font-mono text-[11.5px] leading-relaxed text-ink-2">Semantic events only. No coordinates, keystrokes or field values leave the browser.</p>
        </div>
      </div>
    </section>
  );
}
