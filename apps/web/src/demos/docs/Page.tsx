"use client";

import { Intent, useIntent, useVisitorState } from "adaptmypage";
import { useEffect, useState } from "react";
import { useAdaptation } from "../shared/DemoShell";

const TABS = ["node", "python", "curl", "no_code"] as const;
type Tab = (typeof TABS)[number];
const LABEL: Record<Tab, string> = { node: "Node", python: "Python", curl: "curl", no_code: "No-code" };
const CODE: Record<Tab, string> = {
  node: `import { Vex } from "@vex/ocr";
const vex = new Vex(process.env.VEX_KEY);
const { text, fields } = await vex.ocr({ file: "invoice.pdf", schema: "invoice" });`,
  python: `from vex import Vex
vex = Vex(os.environ["VEX_KEY"])
result = vex.ocr(file="invoice.pdf", schema="invoice")
print(result.fields["total"])`,
  curl: `curl -X POST https://api.vex.dev/v1/ocr \\
  -H "Authorization: Bearer $VEX_KEY" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -F file=@invoice.pdf -F schema=invoice`,
  no_code: `1. Connect Vex to Zapier or Make (no key needed)
2. Trigger: “New file in Drive”
3. Action: “Vex → Extract invoice fields”
4. Output: rows in Google Sheets`,
};
const FACTORS = ["accuracy", "price", "latency", "compliance", "ease"] as const;
type Factor = (typeof FACTORS)[number];

function pick<T extends string>(flags: Record<string, number>, prefix: string, options: readonly T[], min = 0.45): T | null {
  let best: { id: T; p: number } | null = null;
  for (const o of options) {
    const p = flags[`${prefix}:${o}`] ?? 0;
    if (p >= min && (!best || p > best.p)) best = { id: o, p };
  }
  return best?.id ?? null;
}

export default function DocsDemo() {
  const v = useVisitorState();
  const evaluated = v.meta.source !== "initial";
  const [tab, setTab] = useState<Tab>("node");
  const [touched, setTouched] = useState(false);
  const [card, setCard] = useState<Factor | null>(null);
  const target = pick(v.flags, "integration_target", TABS);
  const factor = pick(v.flags, "deciding_factor", FACTORS, 0.5);
  const depth = !evaluated ? "standard" : v.expertise < 0.4 ? "guided" : v.expertise > 0.7 ? "reference" : "standard";
  const support = useIntent("seeking_support", { threshold: 0.5 });
  const technical = useIntent("technical_evaluation", { threshold: 0.6 });
  const pages = 20000;

  useEffect(() => {
    if (target && !touched) setTab(target);
  }, [target, touched]);
  useEffect(() => {
    if (factor) setCard(factor);
  }, [factor]);

  useAdaptation(!!target && !touched, { what: `Opened the ${target ? LABEL[target] : ""} tab first`, flag: target ? `integration_target:${target}` : "integration_target:unknown", code: '<CodeTabs active={pick(flags, "integration_target")} />' });
  useAdaptation(depth === "guided", { what: "Switched the quickstart to step-by-step with explanations", flag: "expertise", code: '{expertise < 0.4 && <StepByStep />}' });
  useAdaptation(depth === "reference", { what: "Collapsed the intro; showed limits, regions and idempotency up front", flag: "expertise", code: '{expertise > 0.7 && <LimitsTable />}' });
  useAdaptation(!!factor, { what: `Showed the ${factor ?? ""} card in “Why Vex”`, detail: "One card instead of five: the one this evaluator is deciding on.", flag: factor ? `deciding_factor:${factor}` : "deciding_factor:ease", code: '<CompareCard kind={pick(flags, "deciding_factor")} />' });
  useAdaptation(support.active, { what: "Expanded common errors", flag: "seeking_support", code: '<Intent when="seeking_support"><CommonErrors /></Intent>' });
  useAdaptation(technical.active, { what: "Added the SDK matrix and status link", flag: "technical_evaluation", code: '<Intent when="technical_evaluation"><SdkMatrix /></Intent>' });

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-24 pt-8 font-[system-ui]">
      <header className="flex items-center justify-between text-[13px]">
        <div className="flex items-center gap-2 font-semibold"><span className="inline-block h-4 w-4 rounded-sm" style={{ background: "var(--accent)" }} />Vex OCR</div>
        <nav className="flex gap-5 text-black/60"><span className="text-black">Docs</span><span>Pricing</span><span>Status</span></nav>
      </header>

      <section id="quickstart" data-section="quickstart" className="mt-8">
        <h1 className="text-[1.8rem] font-semibold tracking-tight">{depth === "guided" ? "Extract text from a document in five minutes" : "Quickstart"}</h1>
        {depth === "guided" ? (
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13px] text-black/70" style={{ animation: "swap-in 500ms both" }}>
            <li>Create a free account (500 pages a month, no card).</li>
            <li>Pick how you want to connect below. No-code works without any programming.</li>
            <li>Send one document and check the fields it returns.</li>
          </ol>
        ) : depth === "reference" ? (
          <p className="mt-2 font-mono text-[12px] text-black/60" style={{ animation: "swap-in 500ms both" }}>POST /v1/ocr · multipart or JSON · sync ≤ 25 MB, async above · Idempotency-Key honoured · regions us, eu</p>
        ) : (
          <p className="mt-2 text-[13px] text-black/70">One request in, structured fields out.</p>
        )}
        <div className="mt-5 flex gap-1 rounded-lg bg-black/5 p-1 text-[12.5px]">
          {TABS.map((t) => (
            <button key={t} type="button" data-intent={LABEL[t]} onClick={() => { setTab(t); setTouched(true); }} className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${tab === t ? "bg-white font-semibold shadow-sm" : "text-black/60"}`}>{LABEL[t]}</button>
          ))}
        </div>
        <pre key={tab} className="mt-2 overflow-x-auto rounded-lg bg-[#0f1a17] p-4 font-mono text-[12px] leading-relaxed text-[#d7f7ee]" style={{ animation: "swap-in 400ms both" }}>{CODE[tab]}</pre>
        {tab === "no_code" ? <p className="mt-2 text-[12.5px] text-black/70">Connect Vex to Zapier in two clicks. <a href="#" data-intent="Book a 15-minute setup call" className="font-semibold underline underline-offset-4">Book a 15-minute setup call</a></p> : null}
      </section>

      <section id="reference" data-section="reference" className="mt-10">
        <h2 className="text-[15px] font-semibold">Reference</h2>
        {depth === "reference" ? (
          <table className="mt-3 w-full font-mono text-[12px]" style={{ animation: "swap-in 500ms both" }}>
            <tbody>
              {[["Rate limit", "600 req/min · burst 100"], ["Max file size", "25 MB sync · 2 GB async"], ["Formats", "PDF, PNG, JPG, TIFF, HEIC"], ["Regions", "api.vex.dev · api.eu.vex.dev"], ["Retries", "Idempotency-Key, 24 h window"]].map(([k, val]) => (
                <tr key={k} className="border-t border-black/10"><td className="py-1.5 text-black/50">{k}</td><td className="py-1.5">{val}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-[13px] text-black/70">Endpoints, limits and SDKs. <a href="#" data-intent="Open full reference" className="font-semibold underline underline-offset-4">Open the full reference</a></p>
        )}
        <Intent when="technical_evaluation" confidence={0.6}>
          <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]" style={{ animation: "swap-in 500ms both" }}>
            {["node 18+", "python 3.9+", "go", "ruby", "php", "openapi 3.1", "status: 99.98% 90d"].map((x) => <span key={x} className="rounded-full border border-black/10 px-2 py-0.5 font-mono">{x}</span>)}
          </div>
        </Intent>
      </section>

      <section id="compare" data-section="compare" className="mt-10">
        <h2 className="text-[15px] font-semibold">Why Vex</h2>
        <div className="mt-3 flex flex-wrap gap-1 text-[12px]">
          {FACTORS.map((f) => (
            <button key={f} type="button" data-intent={f[0]!.toUpperCase() + f.slice(1)} onClick={() => setCard(f)} className={`rounded-full border px-3 py-1 capitalize transition-colors ${card === f ? "border-black bg-black text-white" : "border-black/15"}`}>{f}</button>
          ))}
        </div>
        {card ? (
          <div key={card} className="mt-3 rounded-xl border border-black/10 p-4 text-[13px]" style={{ animation: "popup-in 500ms cubic-bezier(0.22,1,0.36,1) both" }}>
            {card === "accuracy" ? <><p className="font-semibold">98.7% field accuracy on invoices, 97.1% on receipts.</p><p className="mt-1 text-black/70">Public benchmark, 12,000 documents, 41 languages, handwriting included.</p></> : null}
            {card === "price" ? <><p className="font-semibold">$0.0012 per page. Free: 500 pages/month.</p><label className="mt-2 block text-black/70">Pages per month <input name="pages per month" defaultValue={pages} className="ml-2 w-24 rounded border border-black/15 px-2 py-0.5 font-mono text-[12px]" /> ≈ <span className="font-mono">${(pages * 0.0012).toFixed(2)}</span>/mo</label></> : null}
            {card === "latency" ? <><p className="font-semibold">p50 410 ms · p95 1.2 s per page.</p><p className="mt-1 text-black/70">Async batches of 10,000 pages finish in under 4 minutes.</p></> : null}
            {card === "compliance" ? <><p className="font-semibold">SOC 2 Type II · GDPR · HIPAA BAA available.</p><p className="mt-1 text-black/70">Data deleted after 24 hours, or zero retention on request. EU region available. <a href="#" data-intent="Request the DPA" className="font-semibold underline underline-offset-4">Request the DPA</a></p></> : null}
            {card === "ease" ? <><p className="font-semibold">Time to first result: about four minutes.</p><p className="mt-1 text-black/70">Five SDKs, a no-code connector, and schemas for invoices, receipts and IDs.</p></> : null}
          </div>
        ) : <p className="mt-3 text-[13px] text-black/60">Pick what matters to you.</p>}
      </section>

      <section id="errors" data-section="errors" className="mt-10">
        <details open={support.active} className="text-[13px]">
          <summary className="cursor-pointer text-[15px] font-semibold" data-intent="Common errors">Common errors</summary>
          <ul className="mt-2 space-y-1 font-mono text-[12px] text-black/70">
            <li><span className="text-black">429 rate_limited</span> — back off using Retry-After; raise limits in the dashboard.</li>
            <li><span className="text-black">413 file_too_large</span> — use the async endpoint above 25 MB.</li>
            <li><span className="text-black">422 unsupported_schema</span> — schemas: invoice, receipt, id, generic.</li>
          </ul>
        </details>
      </section>
    </div>
  );
}
