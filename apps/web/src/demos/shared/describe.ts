import type { Action } from "adaptmypage";

const strip = (t: string) =>
  t.replace(/^(button|link|code|heading|section|input|div|span|summary|label|select|textarea|img|area|text):/, "");

/** One plain phrase for one semantic event. */
export function describeAction(a: Action): string | null {
  const target = strip(a.target ?? "");
  switch (a.type) {
    case "pageview":
      return "arrived on the page";
    case "navigate":
      return `navigated to ${target}`;
    case "section_enter":
      return target && target !== "hero" && target !== "page" ? `scrolled to ${target}` : null;
    case "section_exit":
      return a.detail && parseFloat(a.detail) >= 3 ? `spent ${a.detail} on ${target}` : null;
    case "scroll_return":
      return `came back to ${target}`;
    case "click":
      return /^area:/.test(a.target ?? "") ? null : `clicked “${target}”`;
    case "hover":
      return a.detail && parseFloat(a.detail) >= 1.2 ? `hovered “${target}” for ${a.detail}` : null;
    case "hesitation":
      return `hovered “${target}” without clicking`;
    case "rage_click":
      return `clicked “${target}” repeatedly`;
    case "copy":
      return /install|curl|npm|pip/i.test(target) ? "copied a command" : "copied a code sample";
    case "select_text":
      return `selected text in ${target}`;
    case "form_focus":
      return `focused the ${target.replace(/^input:/, "")} field`;
    case "form_input":
      return `typed in ${target.replace(/^input:/, "")}`;
    case "form_submit":
      return "submitted the form";
    case "exit_intent":
      return "moved toward the tab bar";
    case "idle":
      return "paused";
    case "resume":
      return "came back";
    case "tab_hidden":
      return "switched tabs";
    case "tab_visible":
      return "returned to the tab";
    case "scroll":
      return a.detail === "100%" ? "reached the bottom" : null;
    case "custom":
      return target;
    default:
      return null;
  }
}

/** Two or three phrases that best explain a flag, most relevant first. */
export function describeEvidence(actions: Action[], flag: string): string[] {
  const words = flag
    .toLowerCase()
    .replace(/^next:/, "")
    .split(/[:_]/)
    .filter((w) => w.length > 2 && !["next", "intent", "risk", "evaluation", "comparison", "none"].includes(w));
  const extra: Record<string, string[]> = {
    price: ["price", "plan", "cost", "annual", "monthly", "$", "pay", "cheap", "free"],
    technical: ["docs", "code", "api", "sdk", "curl", "limit", "reference", "copied"],
    fit: ["size", "fit", "guide", "width", "chart"],
    shipping: ["ship", "return", "delivery", "exchange"],
    durability: ["durab", "review", "material", "outsole", "miles"],
    support: ["faq", "help", "support", "contact", "error", "question"],
    procurement: ["sso", "security", "invoice", "soc", "sales", "compliance", "gdpr"],
    company: ["sso", "security", "invoice", "sales", "team", "seat"],
    trust: ["security", "review", "customers", "encrypt", "privacy"],
    complexity: ["step", "how", "import", "help", "field"],
    abandon: ["tab", "paused", "toward"],
    ready: ["trial", "start", "cart", "checkout", "sign", "create", "buy", "add"],
    buy: ["trial", "start", "cart", "checkout", "sign", "create", "buy", "add"],
    sign: ["trial", "start", "sign", "create", "email"],
    hesitant: ["without clicking", "paused", "came back", "hovered"],
    friction: ["repeatedly", "without clicking", "came back", "paused"],
    expertise: ["code", "api", "spec", "reference", "copied", "limit", "cli"],
    compliance: ["soc", "gdpr", "security", "compliance", "dpa"],
    latency: ["latency", "ms", "speed", "fast"],
    accuracy: ["accuracy", "benchmark", "quality"],
  };
  const keys = new Set<string>(words);
  for (const w of words) for (const k of extra[w] ?? []) keys.add(k);
  const seen = new Set<string>();
  const phrases: Array<{ text: string; hit: boolean }> = [];
  for (const a of actions.slice().reverse()) {
    const text = describeAction(a);
    if (!text || text === "arrived on the page" || seen.has(text)) continue;
    seen.add(text);
    const hay = `${text} ${a.target ?? ""}`.toLowerCase();
    phrases.push({ text, hit: [...keys].some((k) => hay.includes(k)) });
    if (phrases.length > 30) break;
  }
  const hits = phrases.filter((p) => p.hit).slice(0, 3);
  const rest = phrases.filter((p) => !p.hit).slice(0, Math.max(0, 2 - hits.length));
  return [...hits, ...rest].map((p) => p.text);
}
