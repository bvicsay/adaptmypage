import { SectionHeader } from "../ui";

export function Pricing() {
  return (
    <section id="pricing" className="band">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 py-28 sm:px-10 lg:grid-cols-2 lg:gap-20">
        <SectionHeader eyebrow="Pricing" title={<>Open source.<br /><span className="serif-italic">Free.</span></>} lede="Bring your own Jev key and there is nothing to pay us. A judgment costs about $0.00007 at Jev’s list price." />
        <div className="grid gap-4 self-center">
          {[
            ["SDK", "$0", "MIT. Hooks, server handler, custom questions.", "Read the docs", "https://github.com/bvicsay/adaptmypage#readme"],
            ["Self-hosted", "≈ $0.07", "per 1,000 judgments, paid to your Jev provider.", "Get a Jev key", "https://openrouter.ai/typesafe"],
            ["Hosted API", "Early access", "No keys, no route, decision history.", "Join the list", "#subscribe"],
          ].map(([k, price, d, cta, href]) => (
            <div key={k} className="grid grid-cols-[110px_1fr_auto] items-baseline gap-4 border-t border-ink/15 pt-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{k}</span>
              <div><div className="display text-[1.6rem]">{price}</div><p className="mt-1 text-[0.9rem] text-ink-2">{d}</p></div>
              <a href={href} className="link-arrow !text-[0.85rem]" data-intent={`Pricing: ${cta}`}>{cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
