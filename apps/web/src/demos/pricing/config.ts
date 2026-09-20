import type { DemoConfig } from "../types";

export const PRICING: DemoConfig = {
  id: "pricing",
  brand: "Relay",
  name: "Pricing page",
  tagline: "Show the comparison table to the comparer, the trial button to the buyer, and the SSO block to procurement.",
  outcome: "One pricing page, three visitors, three different pages.",
  accent: "#2f5bea",
  siteContext:
    "Pricing page of Relay, a shared team inbox for customer support. Plans: Free ($0, 1 user), Team ($12 per user per month, billed annually or $15 monthly), Business ($29 per user per month, SSO, audit log, invoicing). " +
    "Sections: plans (three plan cards with price toggle), compare (full feature comparison table), companies (SSO, SOC 2, invoicing, talk to sales), faq. Buttons carry their visible text.",
  questions: {
    team_size: {
      type: "choice",
      instructions: "How large is the team this visitor is buying for?",
      criteria: {
        solo: "One person; freelance or personal use; interested in the free tier",
        small_team: "2–15 people; a startup or small company; compares Team and Business",
        company: "16+ people; reads security, SSO, invoicing, audit log; procurement-style behavior",
        unknown: "Not enough signal",
      },
    },
    needs_procurement: {
      type: "noul",
      instructions: "The visitor is evaluating on behalf of an organization with procurement requirements such as security review, SSO, invoicing or compliance.",
    },
    annual_billing: {
      type: "noul",
      instructions: "The visitor prefers or is investigating annual billing and discounts.",
    },
  },
  scenarios: [
    {
      id: "comparer",
      label: "Bargain hunter",
      persona: "Searched “relay vs front pricing”, toggles billing, keeps returning to prices",
      referrer: "https://www.google.com/",
      searchTerms: "relay vs front pricing",
      sections: { plans: { viewedMs: 42000, hoverMs: 26000, views: 3, label: "Plans" }, compare: { viewedMs: 18000, hoverMs: 9000, views: 2, label: "Compare plans" } },
      steps: [
        { t: 0, type: "pageview", target: "/pricing" },
        { t: 2.1, type: "section_enter", target: "plans" },
        { t: 4.8, type: "hover", target: "heading:$12", detail: "2.6s" },
        { t: 7.2, type: "click", target: "button:Annual", detail: "plans" },
        { t: 9.0, type: "hover", target: "heading:$29", detail: "1.9s" },
        { t: 11.5, type: "click", target: "button:Monthly", detail: "plans" },
        { t: 13.0, type: "hover", target: "heading:$15", detail: "2.2s" },
        { t: 16.4, type: "section_enter", target: "compare" },
        { t: 22.0, type: "hover", target: "text:Seats included", detail: "1.8s" },
        { t: 26.7, type: "scroll_return", target: "plans", detail: "10s later" },
        { t: 29.0, type: "hover", target: "heading:$0", detail: "3.1s" },
        { t: 33.2, type: "hesitation", target: "button:Get started free", detail: "plans" },
      ],
    },
    {
      id: "procurement",
      label: "Procurement lead",
      persona: "Came from an internal wiki, reads SSO, SOC 2 and invoicing, ignores prices",
      referrer: "https://wiki.acme-corp.internal/",
      sections: { plans: { viewedMs: 9000, hoverMs: 2000, label: "Plans" }, companies: { viewedMs: 38000, hoverMs: 21000, views: 2, label: "For companies" }, faq: { viewedMs: 12000, hoverMs: 6000, label: "FAQ" } },
      steps: [
        { t: 0, type: "pageview", target: "/pricing" },
        { t: 3.0, type: "section_enter", target: "plans" },
        { t: 5.5, type: "hover", target: "text:SSO & SAML", detail: "2.4s" },
        { t: 8.1, type: "section_enter", target: "companies" },
        { t: 12.0, type: "hover", target: "text:SOC 2 Type II report", detail: "3.3s" },
        { t: 15.8, type: "click", target: "link:Security overview", detail: "companies" },
        { t: 19.2, type: "hover", target: "text:Invoicing & purchase orders", detail: "2.8s" },
        { t: 23.0, type: "select_text", target: "companies", detail: "88 chars" },
        { t: 26.5, type: "section_enter", target: "faq" },
        { t: 30.0, type: "click", target: "summary:Do you sign DPAs?", detail: "faq" },
        { t: 34.4, type: "scroll_return", target: "companies", detail: "8s later" },
        { t: 37.0, type: "hover", target: "button:Talk to sales", detail: "2.1s" },
      ],
    },
    {
      id: "buyer",
      label: "Ready to buy",
      persona: "Returning visitor, goes straight to Team and hovers the trial button",
      referrer: "",
      returning: true,
      sections: { plans: { viewedMs: 21000, hoverMs: 14000, label: "Plans" } },
      steps: [
        { t: 0, type: "pageview", target: "/pricing" },
        { t: 1.6, type: "section_enter", target: "plans" },
        { t: 3.2, type: "click", target: "button:Annual", detail: "plans" },
        { t: 5.0, type: "hover", target: "button:Start Team trial", detail: "2.9s" },
        { t: 7.4, type: "click", target: "text:Team", detail: "plans" },
        { t: 9.1, type: "hover", target: "button:Start Team trial", detail: "1.7s" },
        { t: 11.0, type: "click", target: "button:Start Team trial", detail: "plans" },
      ],
    },
    {
      id: "browser",
      label: "Just browsing",
      persona: "Skims once, no focus, drifts toward leaving",
      referrer: "https://news.ycombinator.com/",
      sections: { plans: { viewedMs: 6000, hoverMs: 800, label: "Plans" }, compare: { viewedMs: 2500, label: "Compare plans" }, faq: { viewedMs: 1500, label: "FAQ" } },
      steps: [
        { t: 0, type: "pageview", target: "/pricing" },
        { t: 2.0, type: "section_enter", target: "plans" },
        { t: 5.0, type: "scroll", detail: "50%" },
        { t: 6.5, type: "section_enter", target: "compare" },
        { t: 8.0, type: "scroll", detail: "100%" },
        { t: 9.0, type: "section_enter", target: "faq" },
        { t: 26.0, type: "idle", target: "faq" },
        { t: 41.0, type: "resume", detail: "15s idle" },
        { t: 42.5, type: "exit_intent", target: "faq" },
      ],
    },
  ],
  routeCode: `// app/api/intent/route.ts
import { createIntentHandler } from "adaptmypage/server";

export const POST = createIntentHandler({
  siteContext: "Pricing page of Relay, a shared team inbox. Plans: Free, Team, Business…",
  questions: {
    team_size: { type: "choice", instructions: "How large is the team this visitor is buying for?",
      criteria: { solo: "…", small_team: "…", company: "…", unknown: "…" } },
    needs_procurement: { type: "noul",
      instructions: "The visitor is evaluating on behalf of an organization with procurement requirements." },
    annual_billing: { type: "noul", instructions: "The visitor is investigating annual billing." },
  },
});`,
  clientCode: `const comparing   = useIntent("price_comparison");
const buying      = useIntent("ready_to_buy", { threshold: 0.5 });
const procurement = useIntent("needs_procurement");
const team        = useVisitorState().flags;   // team:small_team → 0.72

<Intent when="price_comparison">      <ComparisonTable open /> </Intent>
<Intent when="needs_procurement">     <ForCompanies />         </Intent>
<PlanCard recommended={team["team_size:small_team"] > 0.5} />
<CTA label={buying.active ? "Start 14-day trial — no card" : comparing.active ? "Compare plans" : "Get started"} />`,
};
