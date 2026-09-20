import type { Lang } from "./highlight";

export const SNIPPETS: Record<string, { code: string; lang: Lang }> = {
  install: { lang: "bash", code: `npm install adaptmypage` },
  use: {
    lang: "tsx",
    code: `// app/api/intent/route.ts
export const POST = createIntentHandler({
  siteContext: "Pricing page for Relay…",
  questions: { needs_procurement: { type: "noul", instructions: "…" } },
});

// anywhere in the page
<IntentFlagsProvider endpoint="/api/intent">
  <Intent when="price_comparison"> <ComparisonTable /> </Intent>
  <Intent when="needs_procurement"> <ForCompanies />   </Intent>
</IntentFlagsProvider>`,
  },
};
