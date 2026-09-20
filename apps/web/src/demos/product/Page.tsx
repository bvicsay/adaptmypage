"use client";

import { Intent, useIntent, useVisitorState } from "adaptmypage";
import { useState } from "react";
import { useAdaptation } from "../shared/DemoShell";

const SIZES = ["7", "8", "9", "9.5", "10", "10.5", "11", "12"];
const CONCERNS = ["fit_size", "shipping_returns", "price", "durability"] as const;
type Concern = (typeof CONCERNS)[number];

export default function ProductDemo() {
  const s = useVisitorState();
  const [size, setSize] = useState<string | null>(null);
  const runner = useIntent("experienced_runner", { threshold: 0.6 });
  const buying = useIntent("purchase_intent", { threshold: 0.6 });
  const friction = useIntent("friction", { threshold: 0.55 });
  const leaving = useIntent("abandon_risk", { threshold: 0.6 });
  const concern = CONCERNS.reduce<{ id: Concern; p: number } | null>((best, c) => {
    const p = s.flags[`concern:${c}`] ?? 0;
    return p >= 0.5 && (!best || p > best.p) ? { id: c, p } : best;
  }, null);

  useAdaptation(concern?.id === "fit_size", { what: "Opened the size guide and promised free exchanges", flag: "concern:fit_size", code: '{concern === "fit_size" && <SizeGuide />}' });
  useAdaptation(concern?.id === "shipping_returns", { what: "Put shipping and returns above the fold", flag: "concern:shipping_returns", code: '{concern === "shipping_returns" && <ShippingAndReturns />}' });
  useAdaptation(concern?.id === "price", { what: "Showed Pay in 3 and the price-match promise", detail: "No blanket discount; only the shopper who cares about price sees this.", flag: "concern:price", code: '{concern === "price" && <PayInThree />}' });
  useAdaptation(concern?.id === "durability", { what: "Surfaced the durability reviews and outsole material", flag: "concern:durability", code: '{concern === "durability" && <DurabilityReviews />}' });
  useAdaptation(runner.active, { what: "Moved tech specs into the buy box", flag: "experienced_runner", code: '<Intent when="experienced_runner"><TechSpecs first /></Intent>' });
  useAdaptation(buying.active, { what: "Pinned a sticky buy bar with the delivery date", flag: "purchase_intent", code: '<Intent when="purchase_intent" confidence={0.6}><StickyBuyBar /></Intent>' });
  useAdaptation(friction.active && concern?.id !== "fit_size", { what: "Offered the 20-second fit quiz", flag: "friction", code: '<Intent when="friction" confidence={0.55}><FitQuiz /></Intent>' });
  useAdaptation(leaving.active && !buying.active, { what: "Offered “save for later” instead of a discount", flag: "abandon_risk", code: '<Intent when="abandon_risk" confidence={0.6}><SaveForLater /></Intent>' });

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-28 pt-8">
      <header className="flex items-center justify-between text-[13px]">
        <div className="text-[15px] font-semibold tracking-tight">ANDO</div>
        <nav className="flex gap-5 text-black/60"><span>Trail</span><span>Road</span><span>Sale</span></nav>
      </header>

      <section id="buybox" data-section="buybox" className="mt-8 grid gap-6 sm:grid-cols-[1fr_1fr]">
        <div className="aspect-[4/5] rounded-xl" style={{ background: "linear-gradient(160deg, #f4e7dc, var(--accent) 140%)" }} aria-hidden />
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-black/50">Trail · Men’s</p>
          <h1 className="mt-1 text-[1.6rem] font-semibold tracking-tight">Ridge 2</h1>
          <div className="mt-1 text-[1.25rem]">$148</div>
          <Intent when="experienced_runner" confidence={0.6}>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-[#faf6f2] p-3 font-mono text-[11.5px]" style={{ animation: "popup-in 500ms cubic-bezier(0.22,1,0.36,1) both" }}>
              <dt className="text-black/50">Stack</dt><dd>31 / 25 mm</dd>
              <dt className="text-black/50">Drop</dt><dd>6 mm</dd>
              <dt className="text-black/50">Lug depth</dt><dd>4.5 mm</dd>
              <dt className="text-black/50">Weight</dt><dd>272 g</dd>
            </dl>
          </Intent>
          <div className="mt-4 flex items-center justify-between text-[12.5px]"><span className="font-medium">Size</span><span className="text-black/50">Fits true to size, medium width</span></div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {SIZES.map((z) => (
              <button key={z} type="button" data-intent={`Size ${z}`} onClick={() => setSize(z)} className={`rounded-md border py-2 text-[13px] transition-colors ${size === z ? "border-black bg-black text-white" : "border-black/15 hover:border-black"}`}>{z}</button>
            ))}
          </div>
          {concern?.id === "fit_size" ? (
            <div className="mt-3 rounded-lg border border-black/10 p-3 text-[12.5px]" style={{ animation: "popup-in 550ms cubic-bezier(0.22,1,0.36,1) both" }}>
              <p className="font-semibold">Between sizes? Most runners size up half a step.</p>
              <p className="mt-1 text-black/70">Free exchanges for 60 days, both directions, prepaid label.</p>
              <button type="button" data-intent="Open size guide" className="mt-2 text-[12.5px] font-semibold underline underline-offset-4">Open the size guide</button>
            </div>
          ) : null}
          <button type="button" data-intent="Add to cart" className="mt-4 w-full rounded-lg py-3 text-[14px] font-semibold text-white" style={{ background: "var(--accent)" }}>Add to cart</button>
          <p className="mt-2 text-[12px] text-black/60">Free shipping over $100 · Arrives Thu, Sep 24</p>
          <details className="mt-3 text-[12.5px]"><summary className="cursor-pointer font-medium" data-intent="Tech specs">Tech specs</summary></details>
          <div className="mt-2 flex gap-2 text-[12px]"><input placeholder="Promo code" name="promo" className="flex-1 rounded-md border border-black/15 px-2 py-1.5" /><button type="button" data-intent="Apply promo" className="rounded-md border border-black/15 px-3">Apply</button></div>
        </div>
      </section>

      <section id="specs" data-section="specs" className="mt-10">
        <h2 className="text-[15px] font-semibold">Built for long days on rock</h2>
        <div className="mt-3 grid gap-3 text-[12.5px] sm:grid-cols-3">
          <div><div className="font-medium">Stack 31/25 mm</div><div className="text-black/60">Drop 6 mm</div></div>
          <div><div className="font-medium">Lug depth 4.5 mm</div><div className="text-black/60">Vibram Megagrip</div></div>
          <div><div className="font-medium">272 g</div><div className="text-black/60">US M9</div></div>
        </div>
      </section>

      <section id="reassurance" data-section="reassurance" className="mt-10 grid gap-3 sm:grid-cols-2">
        {concern?.id === "shipping_returns" ? (
          <div className="rounded-xl border border-black/10 p-4 text-[12.5px] sm:col-span-2" style={{ animation: "popup-in 550ms cubic-bezier(0.22,1,0.36,1) both" }}>
            <p className="font-semibold">Free 2-day shipping. Free 60-day returns.</p>
            <p className="mt-1 text-black/70">Order by 3 pm and it ships today. Returns are prepaid; refunds land in 3 business days.</p>
          </div>
        ) : null}
        {concern?.id === "price" ? (
          <div className="rounded-xl border border-black/10 p-4 text-[12.5px] sm:col-span-2" style={{ animation: "popup-in 550ms cubic-bezier(0.22,1,0.36,1) both" }}>
            <p className="font-semibold">Pay in 3 × $49.33, no interest.</p>
            <p className="mt-1 text-black/70">Find it cheaper within 14 days and we refund the difference.</p>
          </div>
        ) : null}
        {concern?.id === "durability" ? (
          <div className="rounded-xl border border-black/10 p-4 text-[12.5px] sm:col-span-2" style={{ animation: "popup-in 550ms cubic-bezier(0.22,1,0.36,1) both" }}>
            <p className="font-semibold">Rated 4.8 for durability by 312 runners.</p>
            <p className="mt-1 text-black/70">“420 miles and the outsole is fine.” Vibram Megagrip outsole, ripstop upper, 2-year defect warranty.</p>
          </div>
        ) : null}
        <div className="rounded-xl bg-[#faf6f2] p-4 text-[12.5px]"><p className="font-medium">Made in Portugal</p><p className="text-black/60">Recycled ripstop upper</p></div>
        <div className="rounded-xl bg-[#faf6f2] p-4 text-[12.5px]"><p className="font-medium">2-year warranty</p><p className="text-black/60">Defects, not wear</p></div>
      </section>

      <section id="reviews" data-section="reviews" className="mt-10">
        <h2 className="text-[15px] font-semibold">Reviews</h2>
        <ul className="mt-3 space-y-3 text-[12.5px]">
          <li className="border-t border-black/10 pt-3"><span className="font-medium">Maya · 9.5</span> — Runs slightly short, went up half a size. Grip is unreal on wet rock.</li>
          <li className="border-t border-black/10 pt-3"><span className="font-medium">Ola · 11</span> — 420 miles and the outsole is fine. Upper shows no wear.</li>
          <li className="border-t border-black/10 pt-3"><span className="font-medium">Dev · 10</span> — Wide toe box, medium midfoot. Great for 50k.</li>
        </ul>
      </section>

      {friction.active && concern?.id !== "fit_size" ? (
        <div className="fixed bottom-16 right-4 z-30 w-[260px] rounded-xl border border-black/10 bg-white p-4 text-[12.5px] shadow-xl" style={{ animation: "popup-in 500ms cubic-bezier(0.22,1,0.36,1) both" }}>
          <p className="font-semibold">Not sure about the fit?</p>
          <p className="mt-1 text-black/70">Answer three questions and we’ll pick your size.</p>
          <button type="button" data-intent="Start fit quiz" className="mt-2 font-semibold underline underline-offset-4">Start the fit quiz</button>
        </div>
      ) : null}

      {buying.active ? (
        <div className="fixed inset-x-0 bottom-12 z-30 flex justify-center px-4" style={{ animation: "popup-in 500ms cubic-bezier(0.22,1,0.36,1) both" }}>
          <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] shadow-xl">
            <span>Ridge 2 · {size ? `Size ${size}` : "Pick a size"} · Arrives Thu, Sep 24</span>
            <button type="button" data-intent="Add to cart (sticky)" className="rounded-lg px-3 py-1.5 font-semibold text-white" style={{ background: "var(--accent)" }}>Add to cart</button>
          </div>
        </div>
      ) : leaving.active ? (
        <div className="fixed inset-x-0 bottom-12 z-30 flex justify-center px-4" style={{ animation: "popup-in 500ms cubic-bezier(0.22,1,0.36,1) both" }}>
          <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] shadow-xl">
            <span>Not today? Save it and we’ll email you if the price drops.</span>
            <button type="button" data-intent="Save for later" className="rounded-lg border border-black/15 px-3 py-1.5 font-semibold">Save for later</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
