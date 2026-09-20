"use client";

import { useVisitorState } from "adaptmypage";
import type { LandingSnippets } from "../LandingPage";
import { useAdaptive } from "../adaptive/adaptive-context";
import { TextSwap } from "../adaptive/TextSwap";
import { Code, SectionHeader } from "../ui";

export function Docs({ s }: { s: LandingSnippets }) {
  const { adaptations: a } = useAdaptive();
  const v = useVisitorState();
  const expert = v.meta.source !== "initial" && v.expertise >= 0.72;
  return (
    <section id="docs" data-section="docs" className="band">
      <div className="mx-auto max-w-6xl px-6 py-28 sm:px-10">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <SectionHeader
            eyebrow="Docs"
            title={
              <>
                One route.
                <br />
                One <span className="serif-italic">hook</span>.
              </>
            }
            lede={<TextSwap as="span" text={a.docsLine.text} why={a.docsLine.why} className="block" whyClassName="mt-2" />}
          />
          <div className="self-end lg:text-right">
            <a href="https://github.com/bvicsay/adaptmypage#readme" className="link-arrow" data-intent="Docs: Full reference on GitHub">
              Full reference on GitHub
            </a>
          </div>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <div className="card p-5">
            <p className="font-mono text-[11.5px] text-ink-2">server · the only place your Jev key is used</p>
            <Code html={s.route} className="mt-3" />
          </div>
          <div className="card p-5">
            <p className="font-mono text-[11.5px] text-ink-2">client · flags like any other</p>
            <Code html={s.use} className="mt-3" />
          </div>
          <div className="card p-5 lg:col-span-2">
            <p className="font-mono text-[11.5px] text-ink-2">
              <TextSwap text={expert ? "raw Jev answer · one of six questions" : "the whole visitor state"} why={expert ? a.docsLine.why : null} />
            </p>
            <div className="mt-3 grid gap-5 lg:grid-cols-2">
              <Code html={s.state} />
              {expert ? <Code html={s.raw} /> : <p className="self-center font-mono text-[12px] leading-relaxed text-ink-2">Every number is 0–1. <code className="inline">flags</code> is the flat map the hooks read. <code className="inline">meta.source</code> tells you whether Jev or the heuristic answered.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
