import Link from "next/link";
import { DEMOS, DEMO_IDS } from "@/demos/registry";
import { SectionHeader } from "../ui";

export function Demos() {
  return (
    <section id="demos" className="band">
      <div className="mx-auto max-w-6xl px-6 py-28 sm:px-10">
        <SectionHeader
          eyebrow="Live demos"
          title={<>Four pages.<br />Each one <span className="serif-italic">rewrites itself</span>.</>}
          lede="Real pages using the SDK. Pick two visitors, watch the same URL become two different pages, and read the judgment behind every change. Or be the visitor yourself."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {DEMO_IDS.map((id) => {
            const d = DEMOS[id];
            return (
              <Link key={id} href={`/demo/${id}`} data-intent={`Demo card: ${d.name}`} className="group card flex flex-col p-6 transition-colors hover:bg-card-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">{d.name}</span>
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: d.accent }} aria-hidden />
                </div>
                <h3 className="display mt-4 text-[1.5rem]">{d.brand}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{d.outcome}</p>
                <span className="link-arrow mt-6 !text-[0.9rem]">Watch it change</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
