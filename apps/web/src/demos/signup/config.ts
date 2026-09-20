import type { DemoConfig } from "../types";

export const SIGNUP: DemoConfig = {
  id: "signup",
  brand: "Ledgerly",
  name: "Signup form",
  tagline: "Shorten the form for the hesitant, answer the blocker that is holding them back, get out of the way for the decisive.",
  outcome: "Fewer fields for the person who is about to leave; none removed for the one who isn’t.",
  accent: "#7c3aed",
  siteContext:
    "Signup page for Ledgerly, invoicing software for freelancers and small businesses. Free for up to 5 clients, no card. Sections: form (email, password, company, team size, phone), aside (testimonials, security, pricing note). Fields are named; buttons carry their text.",
  questions: {
    hesitant: {
      type: "noul",
      instructions: "The visitor seems unsure whether to sign up: hovering the button without clicking, re-reading, pausing, jumping between fields.",
    },
    blocker: {
      type: "choice",
      instructions: "What is most likely holding this visitor back from signing up?",
      criteria: {
        trust: "Worried about security, data, or whether the company is legitimate",
        price: "Worried about cost or hidden fees",
        complexity: "Worried the product or setup is complicated or time-consuming",
        commitment: "Doesn't want to give personal details or be locked in",
        none: "No visible blocker",
      },
    },
  },
  scenarios: [
    {
      id: "hesitant",
      label: "Hesitant first-timer",
      persona: "Focuses the email field twice, hovers the button, scrolls to the security note",
      referrer: "https://www.google.com/",
      searchTerms: "is ledgerly safe reviews",
      sections: { form: { viewedMs: 38000, hoverMs: 22000, views: 2, label: "Form" }, aside: { viewedMs: 21000, hoverMs: 12000, views: 2, label: "Aside" } },
      steps: [
        { t: 0, type: "pageview", target: "/signup" },
        { t: 2.0, type: "section_enter", target: "form" },
        { t: 4.5, type: "form_focus", target: "input:email" },
        { t: 9.0, type: "hover", target: "button:Create account", detail: "2.8s" },
        { t: 12.5, type: "section_enter", target: "aside" },
        { t: 16.0, type: "hover", target: "text:Bank-level encryption", detail: "3.1s" },
        { t: 20.0, type: "hover", target: "text:Used by 12,000 businesses", detail: "2.2s" },
        { t: 24.0, type: "scroll_return", target: "form", detail: "11s later" },
        { t: 26.0, type: "form_focus", target: "input:email" },
        { t: 30.5, type: "hesitation", target: "button:Create account", detail: "form" },
        { t: 36.0, type: "hover", target: "input:phone", detail: "2.0s" },
      ],
    },
    {
      id: "rushed",
      label: "Rushed & confused",
      persona: "Rage-clicks the disabled button, jumps between fields, hovers “team size”",
      referrer: "https://producthunt.com/",
      device: "mobile",
      sections: { form: { viewedMs: 29000, hoverMs: 18000, views: 1, label: "Form" } },
      steps: [
        { t: 0, type: "pageview", target: "/signup" },
        { t: 1.5, type: "section_enter", target: "form" },
        { t: 3.0, type: "form_focus", target: "input:company" },
        { t: 5.0, type: "form_focus", target: "input:team size" },
        { t: 7.5, type: "hover", target: "select:team size", detail: "2.1s" },
        { t: 10.0, type: "form_focus", target: "input:email" },
        { t: 12.2, type: "rage_click", target: "button:Create account", detail: "form" },
        { t: 14.0, type: "form_focus", target: "input:phone" },
        { t: 16.5, type: "hesitation", target: "button:Create account", detail: "form" },
        { t: 20.0, type: "hover", target: "text:Why do you need my phone?", detail: "1.8s" },
      ],
    },
    {
      id: "decisive",
      label: "Decisive",
      persona: "Returning from the pricing page, fills email and password in seconds",
      referrer: "https://ledgerly.example/pricing",
      returning: true,
      sections: { form: { viewedMs: 9000, hoverMs: 5000, label: "Form" } },
      steps: [
        { t: 0, type: "pageview", target: "/signup" },
        { t: 1.0, type: "section_enter", target: "form" },
        { t: 1.8, type: "form_focus", target: "input:email" },
        { t: 2.4, type: "form_input", target: "input:email" },
        { t: 4.0, type: "form_focus", target: "input:password" },
        { t: 4.6, type: "form_input", target: "input:password" },
        { t: 6.5, type: "click", target: "button:Create account", detail: "form" },
      ],
    },
    {
      id: "developer",
      label: "Developer",
      persona: "Came from GitHub, hovers the API link, copies the CLI command",
      referrer: "https://github.com/ledgerly/ledgerly-cli",
      sections: { form: { viewedMs: 12000, hoverMs: 6000, label: "Form" }, aside: { viewedMs: 15000, hoverMs: 9000, label: "Aside" } },
      steps: [
        { t: 0, type: "pageview", target: "/signup" },
        { t: 1.5, type: "section_enter", target: "form" },
        { t: 3.0, type: "hover", target: "link:API docs", detail: "1.9s" },
        { t: 5.0, type: "section_enter", target: "aside" },
        { t: 7.5, type: "hover", target: "code:npx ledgerly init", detail: "2.4s" },
        { t: 9.0, type: "copy", target: "code:npx ledgerly init", detail: "\"npx ledgerly init\"" },
        { t: 12.0, type: "click", target: "link:API docs", detail: "form" },
      ],
    },
  ],
  routeCode: `export const POST = createIntentHandler({
  siteContext: "Signup page for Ledgerly, invoicing for small businesses. Sections: form, aside.",
  questions: {
    hesitant: { type: "noul", instructions: "The visitor seems unsure whether to sign up." },
    blocker: { type: "choice", instructions: "What is holding this visitor back?",
      criteria: { trust: "…", price: "…", complexity: "…", commitment: "…", none: "…" } },
  },
});`,
  clientCode: `const friction = useIntent("friction", { threshold: 0.55 });
const hesitant = useIntent("hesitant");
const blocker  = pick(useVisitorState().flags, "blocker");

<Form fields={friction.active ? ["email", "password"] : ALL_FIELDS} />
{hesitant.active && <SocialProof />}
{blocker === "trust"      && <SecurityNote />}
{blocker === "complexity" && <ThreeSteps />}
<Intent when="abandon_risk" confidence={0.6}><FinishLaterLink /></Intent>
<Intent when="expertise" confidence={0.7}><CliAlternative /></Intent>`,
};
