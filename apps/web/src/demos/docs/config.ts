import type { DemoConfig } from "../types";

export const DOCS: DemoConfig = {
  id: "docs",
  brand: "Vex OCR",
  name: "API docs",
  tagline: "Open the right language tab, at the right depth, with the one comparison card this evaluator cares about.",
  outcome: "A senior engineer and a no-code founder land on the same URL and read different docs.",
  accent: "#0f766e",
  siteContext:
    "Documentation landing page for Vex, an OCR API. Sections: quickstart (code tabs: Node, Python, curl, No-code/Zapier), reference (endpoints, limits, SDKs), compare (accuracy benchmark, pricing calculator, latency, compliance), errors (common errors). Code tabs are buttons named after the language.",
  questions: {
    integration_target: {
      type: "choice",
      instructions: "How does this visitor most likely want to integrate?",
      criteria: {
        node: "JavaScript or TypeScript; Node, Next.js, npm",
        python: "Python; pip, notebooks, data pipelines",
        curl: "Raw HTTP; any language; reads the endpoint reference",
        no_code: "No code; Zapier, Make, spreadsheets, wants a hosted option",
        unknown: "Not enough signal",
      },
    },
    deciding_factor: {
      type: "choice",
      instructions: "What will most decide whether this visitor adopts the API?",
      criteria: {
        accuracy: "Recognition quality, benchmarks, languages, handwriting",
        price: "Cost per page, free tier, volume pricing",
        latency: "Speed, p95 latency, batch throughput",
        compliance: "SOC 2, GDPR, data retention, on-prem",
        ease: "Time to first result, SDKs, examples",
      },
    },
  },
  scenarios: [
    {
      id: "engineer",
      label: "Senior backend engineer",
      persona: "Skips the intro, copies curl, reads limits and error codes",
      referrer: "https://github.com/",
      sections: { quickstart: { viewedMs: 14000, hoverMs: 8000, label: "Quickstart" }, reference: { viewedMs: 38000, hoverMs: 24000, views: 2, label: "Reference" }, errors: { viewedMs: 12000, hoverMs: 6000, label: "Errors" } },
      steps: [
        { t: 0, type: "pageview", target: "/docs" },
        { t: 1.5, type: "section_enter", target: "quickstart" },
        { t: 2.8, type: "click", target: "button:curl", detail: "quickstart" },
        { t: 4.5, type: "copy", target: "code:curl -X POST https://api.vex.dev/v1/ocr", detail: "\"curl -X POST\"" },
        { t: 7.0, type: "section_enter", target: "reference" },
        { t: 10.2, type: "hover", target: "text:Rate limit 600 req/min", detail: "2.6s" },
        { t: 13.5, type: "hover", target: "text:Max file size 25 MB", detail: "1.9s" },
        { t: 17.0, type: "select_text", target: "reference", detail: "140 chars" },
        { t: 21.0, type: "section_enter", target: "errors" },
        { t: 24.6, type: "hover", target: "text:429 rate_limited", detail: "2.2s" },
        { t: 28.0, type: "scroll_return", target: "reference", detail: "7s later" },
        { t: 30.5, type: "copy", target: "code:idempotency-key", detail: "\"Idempotency-Key\"" },
      ],
    },
    {
      id: "founder",
      label: "No-code founder",
      persona: "Came from a Zapier search, hovers “no code”, reads slowly, avoids code",
      referrer: "https://www.google.com/",
      searchTerms: "ocr api zapier no code invoices",
      sections: { quickstart: { viewedMs: 44000, hoverMs: 21000, views: 2, label: "Quickstart" }, compare: { viewedMs: 16000, hoverMs: 8000, label: "Compare" } },
      steps: [
        { t: 0, type: "pageview", target: "/docs" },
        { t: 2.5, type: "section_enter", target: "quickstart" },
        { t: 6.0, type: "hover", target: "button:No-code", detail: "3.2s" },
        { t: 9.4, type: "click", target: "button:No-code", detail: "quickstart" },
        { t: 14.0, type: "hover", target: "text:Connect Vex to Zapier", detail: "4.1s" },
        { t: 19.5, type: "hesitation", target: "button:Python", detail: "quickstart" },
        { t: 24.0, type: "section_enter", target: "compare" },
        { t: 28.0, type: "hover", target: "text:Time to first result", detail: "2.7s" },
        { t: 33.0, type: "scroll_return", target: "quickstart", detail: "9s later" },
        { t: 36.0, type: "hover", target: "link:Book a 15-minute setup call", detail: "2.4s" },
      ],
    },
    {
      id: "security",
      label: "Security reviewer",
      persona: "Reads compliance, data retention and region options; ignores code",
      referrer: "https://vanta.com/",
      sections: { compare: { viewedMs: 41000, hoverMs: 26000, views: 2, label: "Compare" }, reference: { viewedMs: 9000, hoverMs: 3000, label: "Reference" } },
      steps: [
        { t: 0, type: "pageview", target: "/docs" },
        { t: 2.0, type: "section_enter", target: "quickstart" },
        { t: 4.0, type: "section_enter", target: "compare" },
        { t: 7.5, type: "click", target: "button:Compliance", detail: "compare" },
        { t: 10.5, type: "hover", target: "text:SOC 2 Type II", detail: "3.0s" },
        { t: 14.0, type: "hover", target: "text:Data deleted after 24 hours", detail: "3.6s" },
        { t: 18.0, type: "select_text", target: "compare", detail: "96 chars" },
        { t: 22.0, type: "click", target: "link:Request the DPA", detail: "compare" },
        { t: 26.0, type: "section_enter", target: "reference" },
        { t: 29.0, type: "hover", target: "text:EU region: api.eu.vex.dev", detail: "2.5s" },
        { t: 33.0, type: "scroll_return", target: "compare", detail: "7s later" },
      ],
    },
    {
      id: "comparer",
      label: "Comparing vendors",
      persona: "Has the pricing calculator and the benchmark open, from a comparison blog",
      referrer: "https://blog.example.com/best-ocr-apis-2026",
      sections: { compare: { viewedMs: 39000, hoverMs: 27000, views: 3, label: "Compare" }, quickstart: { viewedMs: 6000, label: "Quickstart" } },
      steps: [
        { t: 0, type: "pageview", target: "/docs" },
        { t: 2.2, type: "section_enter", target: "quickstart" },
        { t: 4.0, type: "section_enter", target: "compare" },
        { t: 6.5, type: "click", target: "button:Pricing", detail: "compare" },
        { t: 9.0, type: "form_focus", target: "input:pages per month" },
        { t: 10.0, type: "form_input", target: "input:pages per month" },
        { t: 13.5, type: "hover", target: "text:$0.0012 per page", detail: "2.9s" },
        { t: 17.0, type: "click", target: "button:Accuracy", detail: "compare" },
        { t: 20.5, type: "hover", target: "text:98.7% on invoices", detail: "3.3s" },
        { t: 24.0, type: "click", target: "button:Pricing", detail: "compare" },
        { t: 27.0, type: "hover", target: "text:Free: 500 pages/month", detail: "2.1s" },
      ],
    },
  ],
  routeCode: `export const POST = createIntentHandler({
  siteContext: "Docs landing page for Vex, an OCR API. Sections: quickstart (code tabs), reference, compare, errors.",
  questions: {
    integration_target: { type: "choice", instructions: "How does this visitor want to integrate?",
      criteria: { node: "…", python: "…", curl: "…", no_code: "…", unknown: "…" } },
    deciding_factor: { type: "choice", instructions: "What will decide whether this visitor adopts the API?",
      criteria: { accuracy: "…", price: "…", latency: "…", compliance: "…", ease: "…" } },
  },
});`,
  clientCode: `const v = useVisitorState();
const tab   = pick(v.flags, "integration_target") ?? "node";   // opens the right code tab
const depth = v.expertise < 0.4 ? "guided" : v.expertise > 0.7 ? "reference" : "standard";
const card  = pick(v.flags, "deciding_factor");                // one comparison card, not five

<CodeTabs active={tab} />
{depth === "guided"    && <StepByStep />}
{depth === "reference" && <LimitsTable />}
{card && <CompareCard kind={card} />}
<Intent when="seeking_support"><CommonErrors /></Intent>`,
};
