"use client";

import { Intent, useIntent, useVisitorState } from "adaptmypage";
import { useEffect, useState } from "react";
import { useAdaptation } from "../shared/DemoShell";

const PLANS = [
  { id: "free", name: "Free", monthly: 0, annual: 0, seats: "1 user", blurb: "For trying Relay on your own inbox.", cta: "Get started free", size: "solo" },
  { id: "team", name: "Team", monthly: 15, annual: 12, seats: "Up to 15 users", blurb: "Shared inbox, assignments, SLAs.", cta: "Start Team trial", size: "small_team" },
  { id: "business", name: "Business", monthly: 35, annual: 29, seats: "Unlimited users", blurb: "SSO, audit log, invoicing.", cta: "Start Business trial", size: "company" },
] as const;

const ROWS: Array<[string, string, string, string]> = [
  ["Seats included", "1", "15", "Unlimited"],
  ["Shared inboxes", "1", "5", "Unlimited"],
  ["Assignments & SLAs", "—", "✓", "✓"],
  ["Integrations", "3", "All", "All + custom"],
  ["SSO & SAML", "—", "—", "✓"],
  ["Audit log", "—", "30 days", "2 years"],
  ["Support", "Community", "Email", "Priority + CSM"],
];

export default function PricingDemo() {
  const s = useVisitorState();
  const comparing = useIntent("price_comparison", { threshold: 0.55 });
  const buying = useIntent("ready_to_buy", { threshold: 0.5 });
  const support = useIntent("seeking_support", { threshold: 0.5 });
  const procurement = useIntent("needs_procurement", { threshold: 0.6 });
  const annual = useIntent("annual_billing", { threshold: 0.6 });
  const leaving = useIntent("abandon_risk", { threshold: 0.6 });
  const expert = useIntent("expertise", { threshold: 0.7 });
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openCompare, setOpenCompare] = useState(false);

  const recommended = (["solo", "small_team", "company"] as const).reduce<{ id: string; p: number } | null>((best, k) => {
    const p = s.flags[`team_size:${k}`] ?? 0;
    return p >= 0.5 && (!best || p > best.p) ? { id: k, p } : best;
  }, null);

  useEffect(() => {
    if (annual.active) setBilling("annual");
  }, [annual.active]);
  useEffect(() => {
    if (comparing.active) setOpenCompare(true);
  }, [comparing.active]);

  const showCompare = (openCompare || comparing.active) && !buying.active;
  const ctaLabel = buying.active ? "Start 14-day trial — no card" : comparing.active ? "Compare plans" : "Get started";

  useAdaptation(comparing.active, { what: "Opened the full comparison table", detail: "Comparers want the whole grid, not a summary.", flag: "price_comparison", code: '<Intent when="price_comparison"><ComparisonTable open /></Intent>' });
  useAdaptation(annual.active, { what: "Switched the toggle to annual pricing", flag: "annual_billing", code: 'if (useIntent("annual_billing").active) setBilling("annual")' });
  useAdaptation(buying.active, { what: "Button → “Start 14-day trial — no card”, comparison hidden", detail: "Buyers get fewer things to read.", flag: "ready_to_buy", code: 'label={buying.active ? "Start 14-day trial — no card" : "Get started"}' });
  useAdaptation(procurement.active, { what: "Showed the “For companies” block: SSO, SOC 2, invoicing", flag: "needs_procurement", code: '<Intent when="needs_procurement"><ForCompanies /></Intent>' });
  useAdaptation(!!recommended, { what: `Marked ${recommended ? PLANS.find((p) => p.size === recommended.id)?.name : ""} as “Recommended for you”`, flag: recommended ? `team_size:${recommended.id}` : "team_size:unknown", code: 'recommended={flags["team_size:small_team"] > 0.5}' });
  useAdaptation(support.active, { what: "Expanded the FAQ", flag: "seeking_support", code: '<Faq open={useIntent("seeking_support").active} />' });
  useAdaptation(leaving.active && !buying.active, { what: "Offered a two-minute chat before leaving", flag: "abandon_risk", code: '<Intent when="abandon_risk" confidence={0.6}><HelpBar /></Intent>' });
  useAdaptation(expert.active, { what: "Added the API & rate-limit row to the table", flag: "expertise", code: 'expertise > 0.7 && <Row label="API rate limit" />' });

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-24 pt-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold"><span className="inline-block h-5 w-5 rounded-md" style={{ background: "var(--accent)" }} />Relay</div>
        <nav className="flex gap-5 text-[13px] text-black/60"><span>Product</span><span className="text-black">Pricing</span><span>Docs</span></nav>
      </header>

      <section id="plans" data-section="plans" className="mt-10">
        <h1 className="text-[2rem] font-semibold tracking-tight">Simple pricing for every inbox.</h1>
        <div className="mt-5 inline-flex rounded-full border border-black/10 p-1 text-[13px]">
          {(["monthly", "annual"] as const).map((b) => (
            <button key={b} type="button" data-intent={b === "monthly" ? "Monthly" : "Annual"} onClick={() => setBilling(b)} className={`rounded-full px-3 py-1 capitalize transition-colors ${billing === b ? "bg-black text-white" : "text-black/60"}`}>
              {b}{b === "annual" ? " · save 20%" : ""}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PLANS.map((p) => {
            const rec = recommended?.id === p.size;
            const price = billing === "annual" ? p.annual : p.monthly;
            return (
              <div key={p.id} className={`relative rounded-xl border p-4 transition-all duration-500 ${rec ? "border-[var(--accent)] shadow-[0_0_0_3px_rgba(47,91,234,0.12)]" : "border-black/10"}`}>
                {rec ? <span className="absolute -top-2.5 left-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: "var(--accent)", animation: "popup-in 500ms cubic-bezier(0.22,1,0.36,1) both" }}>Recommended for you</span> : null}
                <div className="text-[13px] font-semibold">{p.name}</div>
                <div className="mt-2 flex items-baseline gap-1"><span className="text-[1.6rem] font-semibold tracking-tight">${price}</span><span className="text-[12px] text-black/50">{p.monthly ? "/user/mo" : ""}</span></div>
                <div className="text-[12px] text-black/60">{p.seats}</div>
                <p className="mt-2 text-[12.5px] text-black/70">{p.blurb}</p>
                <button type="button" data-intent={p.id === "team" && buying.active ? ctaLabel : p.cta} className={`mt-4 w-full rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${p.id === "team" || rec ? "text-white" : "border border-black/15 text-black"}`} style={p.id === "team" || rec ? { background: "var(--accent)" } : undefined}>
                  {p.id === "team" ? ctaLabel === "Get started" ? p.cta : ctaLabel : p.cta}
                </button>
              </div>
            );
          })}
        </div>
        {buying.active ? <p className="mt-3 text-[12.5px] text-black/60" style={{ animation: "swap-in 500ms both" }}>Most teams are set up in about ten minutes. No card needed for the trial.</p> : null}
      </section>

      <section id="compare" data-section="compare" className="mt-10">
        <button type="button" data-intent={showCompare ? "Hide comparison" : "Compare all features"} onClick={() => setOpenCompare((v) => !v)} className="text-[13px] font-semibold underline underline-offset-4">
          {showCompare ? "Hide comparison" : "Compare all features"}
        </button>
        <div className="grid transition-[grid-template-rows] duration-500" style={{ gridTemplateRows: showCompare ? "1fr" : "0fr" }}>
          <div className="overflow-hidden">
            <table className="mt-4 w-full text-[12.5px]">
              <thead><tr className="text-left text-black/50"><th className="py-2 font-medium">Feature</th><th className="font-medium">Free</th><th className="font-medium">Team</th><th className="font-medium">Business</th></tr></thead>
              <tbody>
                {ROWS.map(([f, a, b, c]) => (
                  <tr key={f} className="border-t border-black/5"><td className="py-2">{f}</td><td>{a}</td><td>{b}</td><td>{c}</td></tr>
                ))}
                {expert.active ? <tr className="border-t border-black/5" style={{ animation: "swap-in 500ms both" }}><td className="py-2">API rate limit</td><td>60/min</td><td>600/min</td><td>6,000/min</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Intent when="needs_procurement" confidence={0.6}>
        <section id="companies" data-section="companies" className="mt-10 rounded-xl bg-[#f3f5fb] p-5" style={{ animation: "popup-in 600ms cubic-bezier(0.22,1,0.36,1) both" }}>
          <h2 className="text-[15px] font-semibold">For companies</h2>
          <ul className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
            <li>✓ SSO & SAML, SCIM provisioning</li>
            <li>✓ SOC 2 Type II report on request</li>
            <li>✓ Invoicing & purchase orders</li>
            <li>✓ DPA, EU data residency</li>
          </ul>
          <div className="mt-4 flex gap-3 text-[13px]">
            <button type="button" data-intent="Talk to sales" className="rounded-lg px-3 py-2 font-semibold text-white" style={{ background: "var(--accent)" }}>Talk to sales</button>
            <a href="#" data-intent="Security overview" className="rounded-lg border border-black/15 px-3 py-2 font-semibold">Security overview</a>
          </div>
        </section>
      </Intent>

      <section id="faq" data-section="faq" className="mt-10">
        <h2 className="text-[15px] font-semibold">Questions</h2>
        {[
          ["Can I change plans later?", "Yes, upgrades apply immediately and downgrades at the next cycle."],
          ["Do you sign DPAs?", "Yes. Business includes a DPA and EU data residency."],
          ["Is there a discount for non-profits?", "50% off Team and Business with proof of status."],
        ].map(([q, a]) => (
          <details key={q} open={support.active} className="border-t border-black/10 py-3 text-[13px]">
            <summary className="cursor-pointer font-medium" data-intent={q}>{q}</summary>
            <p className="mt-2 text-black/70">{a}</p>
          </details>
        ))}
      </section>

      {leaving.active && !buying.active ? (
        <div className="fixed inset-x-0 bottom-12 z-30 flex justify-center px-4" style={{ animation: "popup-in 500ms cubic-bezier(0.22,1,0.36,1) both" }}>
          <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white px-4 py-3 text-[13px] shadow-xl">
            <span>Not sure which plan fits? Two-minute chat, no pitch.</span>
            <button type="button" data-intent="Ask us" className="rounded-lg px-3 py-1.5 font-semibold text-white" style={{ background: "var(--accent)" }}>Ask us</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
