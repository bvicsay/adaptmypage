"use client";

import { Intent, useIntent, useVisitorState } from "adaptmypage";
import { useAdaptation } from "../shared/DemoShell";

const BLOCKERS = ["trust", "price", "complexity", "commitment"] as const;
type Blocker = (typeof BLOCKERS)[number];

export default function SignupDemo() {
  const v = useVisitorState();
  const friction = useIntent("friction", { threshold: 0.55 });
  const hesitant = useIntent("hesitant", { threshold: 0.6 });
  const decisive = useIntent("ready_to_buy", { threshold: 0.55 });
  const leaving = useIntent("abandon_risk", { threshold: 0.6 });
  const dev = useIntent("expertise", { threshold: 0.7 });
  const blocker = BLOCKERS.reduce<{ id: Blocker; p: number } | null>((best, b) => {
    const p = v.flags[`blocker:${b}`] ?? 0;
    return p >= 0.5 && (!best || p > best.p) ? { id: b, p } : best;
  }, null);
  const short = friction.active || leaving.active;

  useAdaptation(short, { what: "Shortened the form to email and password", detail: "Company, team size and phone are asked after the first invoice.", flag: friction.active ? "friction" : "abandon_risk", code: '<Form fields={friction.active ? ["email", "password"] : ALL_FIELDS} />' });
  useAdaptation(hesitant.active, { what: "Added social proof and “no card, cancel anytime” under the button", flag: "hesitant", code: '{hesitant.active && <SocialProof />}' });
  useAdaptation(blocker?.id === "trust", { what: "Showed the security note and the customer count", flag: "blocker:trust", code: '{blocker === "trust" && <SecurityNote />}' });
  useAdaptation(blocker?.id === "price", { what: "Put “Free for up to 5 clients” next to the button", flag: "blocker:price", code: '{blocker === "price" && <FreeTierNote />}' });
  useAdaptation(blocker?.id === "complexity", { what: "Showed the three-step setup with a time estimate", flag: "blocker:complexity", code: '{blocker === "complexity" && <ThreeSteps />}' });
  useAdaptation(blocker?.id === "commitment", { what: "Explained why each field is asked and dropped the phone field", flag: "blocker:commitment", code: '{blocker === "commitment" && <WhyWeAsk />}' });
  useAdaptation(decisive.active, { what: "Hid the sidebar; one big button", flag: "ready_to_buy", code: '{!decisive.active && <Aside />}' });
  useAdaptation(leaving.active, { what: "Offered to email a link to finish later", flag: "abandon_risk", code: '<Intent when="abandon_risk" confidence={0.6}><FinishLaterLink /></Intent>' });
  useAdaptation(dev.active, { what: "Offered the CLI instead of the form", flag: "expertise", code: '<Intent when="expertise" confidence={0.7}><CliAlternative /></Intent>' });

  const fields = short
    ? (["email", "password"] as const)
    : blocker?.id === "commitment"
      ? (["email", "password", "company", "team size"] as const)
      : (["email", "password", "company", "team size", "phone"] as const);

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-24 pt-8">
      <header className="flex items-center justify-between text-[13px]">
        <div className="flex items-center gap-2 font-semibold"><span className="inline-block h-5 w-5 rounded-full" style={{ background: "var(--accent)" }} />Ledgerly</div>
        <a href="#" data-intent="API docs" className="text-black/60">API docs</a>
      </header>

      <div className={`mt-8 grid gap-8 ${decisive.active ? "" : "sm:grid-cols-[1.1fr_0.9fr]"}`}>
        <section id="form" data-section="form">
          <h1 className="text-[1.7rem] font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-[13px] text-black/60">
            {short ? "Two fields. We’ll ask the rest after your first invoice." : blocker?.id === "complexity" ? "Three steps, about two minutes." : "Free for up to 5 clients. No card."}
          </p>
          {blocker?.id === "complexity" ? (
            <ol className="mt-3 flex gap-2 text-[11.5px]" style={{ animation: "swap-in 500ms both" }}>
              {["Account", "Your business", "First invoice"].map((s, i) => <li key={s} className={`flex-1 rounded-md px-2 py-1 ${i === 0 ? "bg-black text-white" : "bg-black/5"}`}>{i + 1}. {s}</li>)}
            </ol>
          ) : null}
          <form className="mt-5 space-y-3" onSubmit={(e) => e.preventDefault()} name="signup">
            {fields.map((f) => (
              <label key={f} className="block text-[12.5px]" style={{ animation: "swap-in 450ms both" }}>
                <span className="capitalize text-black/70">{f}{f === "phone" ? " (optional)" : ""}</span>
                {f === "team size" ? (
                  <select name="team size" className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-[13px]"><option>Just me</option><option>2–5</option><option>6–20</option></select>
                ) : (
                  <input name={f} type={f === "password" ? "password" : f === "email" ? "email" : "text"} className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-[13px]" />
                )}
                {blocker?.id === "commitment" && f === "company" ? <span className="mt-1 block text-[11.5px] text-black/50">Shown on your invoices. You can change it later.</span> : null}
              </label>
            ))}
            <button type="submit" data-intent="Create account" className={`w-full rounded-lg py-3 text-[14px] font-semibold text-white ${decisive.active ? "text-[16px]" : ""}`} style={{ background: "var(--accent)" }}>Create account</button>
            <p className="text-[12px] text-black/60">
              {blocker?.id === "price" ? <span style={{ animation: "swap-in 500ms both" }}>Free for up to 5 clients. Paid plans from $9/mo, cancel anytime.</span> : hesitant.active ? <span style={{ animation: "swap-in 500ms both" }}>No card. Cancel anytime. Used by 12,000 businesses.</span> : "By continuing you agree to the terms."}
            </p>
          </form>
          <Intent when="abandon_risk" confidence={0.6}>
            <p className="mt-3 text-[12.5px]" style={{ animation: "swap-in 500ms both" }}>Short on time? <button type="button" data-intent="Email me a link" className="font-semibold underline underline-offset-4">Email me a link to finish later</button></p>
          </Intent>
          <Intent when="expertise" confidence={0.7}>
            <div className="mt-4 rounded-lg bg-[#0f0d1a] p-3 font-mono text-[12px] text-[#e9ddff]" style={{ animation: "popup-in 500ms cubic-bezier(0.22,1,0.36,1) both" }}>
              <p className="text-white/50"># prefer the terminal? creates the account and a first invoice</p>
              <code>npx ledgerly init</code>
            </div>
          </Intent>
        </section>

        {!decisive.active ? (
          <aside id="aside" data-section="aside" className="space-y-3 text-[12.5px]">
            {blocker?.id === "trust" || hesitant.active ? (
              <div className="rounded-xl border border-black/10 p-4" style={{ animation: "popup-in 500ms cubic-bezier(0.22,1,0.36,1) both" }}>
                <p className="font-semibold">Bank-level encryption. SOC 2 audited.</p>
                <p className="mt-1 text-black/70">Your data is yours: export or delete it any time. Used by 12,000 businesses since 2021.</p>
              </div>
            ) : null}
            <blockquote className="rounded-xl bg-[#f6f2fd] p-4"><p>“Sent my first invoice four minutes after signing up.”</p><footer className="mt-1 text-black/50">— Priya, illustrator</footer></blockquote>
            <blockquote className="rounded-xl bg-[#f6f2fd] p-4"><p>“Finally an invoicing tool that doesn’t need a tutorial.”</p><footer className="mt-1 text-black/50">— Tomas, electrician</footer></blockquote>
            <p className="text-black/50">Why do you need my phone? Only for account recovery. It’s optional.</p>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
