"use client";

import { Button, SectionHeader } from "../ui";

// Jev list price and the observed request size of this page's six-question payload (measured via OpenRouter).
const USD_PER_M_TOKENS = 0.042;
const TOKENS_PER_DECISION = 1700;
const perDecision = (TOKENS_PER_DECISION * USD_PER_M_TOKENS) / 1_000_000;

export function Pricing() {
  return (
    <section id="pricing" data-section="pricing" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHeader
          eyebrow="Pricing"
          title="The SDK is free. A judgment costs about a hundredth of a cent."
          lede="Bring your own Jev key and there is nothing to pay us. The hosted API is for teams who’d rather not run the route, and it’s opening to the list first."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Card
            name="Open-source SDK"
            price="$0"
            unit="MIT, forever"
            cta={<Button href="#docs" variant="secondary" dataIntent="Pricing: Read the quickstart">Read the quickstart</Button>}
            items={[
              "React hooks, <Intent>, vanilla core",
              "Server handler for any fetch runtime",
              "Six built-in judgments + custom questions",
              "Live debugging panel (the one on this page)",
              "Heuristic fallback when no key is set",
            ]}
          />
          <Card
            name="Self-hosted with your Jev key"
            price={`$${(perDecision * 1000).toFixed(3)}`}
            unit="per 1,000 decisions, paid to TypeSafe"
            highlight
            cta={<Button href="https://vercel.com/ai-gateway/models/jev" variant="secondary" dataIntent="Pricing: Get a Jev key">Get a Jev key</Button>}
            items={[
              `≈${TOKENS_PER_DECISION.toLocaleString()} input tokens × $${USD_PER_M_TOKENS}/M — output is free`,
              "A visitor is judged ~6–10 times per session",
              `10,000 sessions/month ≈ $${(perDecision * 8 * 10000).toFixed(2)}`,
              "Direct to TypeSafe, via Vercel AI Gateway, or via OpenRouter",
              "Zero data retention option on the gateway",
            ]}
          />
          <Card
            name="Hosted API"
            price="Early access"
            unit="pricing announced to the list"
            cta={<Button href="#subscribe" dataIntent="Pricing: Join early access">Join early access</Button>}
            items={[
              "No keys, no route: one project key in the provider",
              "Decision history and per-page intent breakdowns",
              "Custom question schemas in a dashboard",
              "Which adaptation worked for which state",
              "Team access",
            ]}
          />
        </div>
        <p className="mt-5 font-mono text-[11.5px] text-ink-3">
          Cost math uses Jev’s published rate ($0.042 per million input tokens) and the ~1,700-token size this page’s six-question request reports back after a minute of browsing. Shorter sessions cost less.
        </p>
      </div>
    </section>
  );
}

function Card({ name, price, unit, items, cta, highlight }: { name: string; price: string; unit: string; items: string[]; cta: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex flex-col rounded-[12px] border bg-surface p-6 ${highlight ? "border-signal shadow-panel" : "border-line"}`}>
      <div className="eyebrow">{name}</div>
      <div className="display mt-3 text-[2.2rem]">{price}</div>
      <div className="mt-1 text-[13px] text-ink-3">{unit}</div>
      <ul className="mt-5 space-y-2 text-[14px] text-ink-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal" aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 pt-2">{cta}</div>
    </div>
  );
}
