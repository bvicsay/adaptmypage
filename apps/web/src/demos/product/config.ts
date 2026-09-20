import type { DemoConfig } from "../types";

export const PRODUCT: DemoConfig = {
  id: "product",
  brand: "Ando",
  name: "Product page",
  tagline: "Answer the one concern that is stopping the purchase: fit, shipping, price or durability.",
  outcome: "The reassurance the shopper actually needs, not a discount pop-up for everyone.",
  accent: "#d9480f",
  siteContext:
    "Product page for the Ando Ridge 2, a trail running shoe, $148. Sections: buybox (gallery, size selector with sizes 7–13, Add to cart), specs (stack height, drop, lug depth, weight), reassurance (size guide, shipping & returns, durability reviews, payment options), reviews. " +
    "Size buttons carry their size; other buttons carry their visible text.",
  questions: {
    concern: {
      type: "choice",
      instructions: "What is the main thing holding this shopper back from adding to cart?",
      criteria: {
        fit_size: "Unsure about sizing or width; hovers or toggles sizes, looks for a size guide",
        shipping_returns: "Worried about delivery time, shipping cost or returns",
        price: "Price-sensitive; hovers the price, looks for discounts or payment plans",
        durability: "Doubts about quality or how long the shoe lasts; reads reviews and materials",
        none: "No visible blocker; browsing or ready to buy",
      },
    },
    experienced_runner: {
      type: "noul",
      instructions: "The shopper appears to be an experienced runner who cares about technical specs (drop, stack height, lugs).",
    },
  },
  scenarios: [
    {
      id: "fit",
      label: "Worried about fit",
      persona: "Toggles between two sizes, hovers the width note, never adds to cart",
      referrer: "https://www.google.com/",
      searchTerms: "ando ridge 2 run small",
      sections: { buybox: { viewedMs: 46000, hoverMs: 31000, views: 2, label: "Buy box" }, reviews: { viewedMs: 9000, hoverMs: 4000, label: "Reviews" } },
      steps: [
        { t: 0, type: "pageview", target: "/ridge-2" },
        { t: 2.0, type: "section_enter", target: "buybox" },
        { t: 4.2, type: "click", target: "button:Size 9", detail: "buybox" },
        { t: 6.0, type: "hover", target: "button:Size 9.5", detail: "2.3s" },
        { t: 8.5, type: "click", target: "button:Size 9.5", detail: "buybox" },
        { t: 10.9, type: "hover", target: "text:Fits true to size, medium width", detail: "3.4s" },
        { t: 14.0, type: "click", target: "button:Size 9", detail: "buybox" },
        { t: 17.3, type: "section_enter", target: "reviews" },
        { t: 21.0, type: "select_text", target: "reviews", detail: "64 chars" },
        { t: 25.5, type: "scroll_return", target: "buybox", detail: "8s later" },
        { t: 27.0, type: "hesitation", target: "button:Add to cart", detail: "buybox" },
        { t: 31.2, type: "hover", target: "button:Size 9.5", detail: "1.9s" },
      ],
    },
    {
      id: "price",
      label: "Price-conscious",
      persona: "Arrived from a deals site, hovers the price, hunts for a code",
      referrer: "https://slickdeals.net/",
      sections: { buybox: { viewedMs: 24000, hoverMs: 15000, label: "Buy box" }, reassurance: { viewedMs: 8000, hoverMs: 3000, label: "Reassurance" } },
      steps: [
        { t: 0, type: "pageview", target: "/ridge-2" },
        { t: 1.8, type: "section_enter", target: "buybox" },
        { t: 3.5, type: "hover", target: "heading:$148", detail: "3.8s" },
        { t: 7.0, type: "click", target: "input:promo", detail: "buybox" },
        { t: 8.2, type: "form_focus", target: "input:promo" },
        { t: 12.0, type: "hover", target: "text:Free shipping over $100", detail: "1.6s" },
        { t: 15.0, type: "section_enter", target: "reassurance" },
        { t: 18.4, type: "scroll_return", target: "buybox", detail: "5s later" },
        { t: 20.0, type: "hover", target: "heading:$148", detail: "2.2s" },
        { t: 23.0, type: "tab_hidden" },
        { t: 31.0, type: "tab_visible" },
      ],
    },
    {
      id: "buyer",
      label: "Ready to check out",
      persona: "Returning, picks a size in two seconds, reads delivery date",
      returning: true,
      sections: { buybox: { viewedMs: 14000, hoverMs: 9000, label: "Buy box" } },
      steps: [
        { t: 0, type: "pageview", target: "/ridge-2" },
        { t: 1.2, type: "section_enter", target: "buybox" },
        { t: 2.4, type: "click", target: "button:Size 10", detail: "buybox" },
        { t: 4.0, type: "hover", target: "text:Arrives Thu, Sep 24", detail: "1.5s" },
        { t: 6.1, type: "hover", target: "button:Add to cart", detail: "1.3s" },
        { t: 7.5, type: "click", target: "button:Add to cart", detail: "buybox" },
      ],
    },
    {
      id: "nerd",
      label: "Gear nerd",
      persona: "Goes straight to specs, compares drop and lug depth, reads durability reviews",
      referrer: "https://www.reddit.com/r/trailrunning/",
      sections: { specs: { viewedMs: 36000, hoverMs: 22000, views: 2, label: "Specs" }, reviews: { viewedMs: 20000, hoverMs: 12000, label: "Reviews" }, buybox: { viewedMs: 7000, label: "Buy box" } },
      steps: [
        { t: 0, type: "pageview", target: "/ridge-2" },
        { t: 1.5, type: "section_enter", target: "buybox" },
        { t: 3.0, type: "click", target: "summary:Tech specs", detail: "specs" },
        { t: 4.0, type: "section_enter", target: "specs" },
        { t: 7.6, type: "hover", target: "text:Drop 6 mm", detail: "2.8s" },
        { t: 10.9, type: "hover", target: "text:Lug depth 4.5 mm", detail: "3.1s" },
        { t: 14.2, type: "select_text", target: "specs", detail: "120 chars" },
        { t: 18.0, type: "section_enter", target: "reviews" },
        { t: 22.5, type: "hover", target: "text:420 miles and the outsole is fine", detail: "2.6s" },
        { t: 27.0, type: "scroll_return", target: "specs", detail: "9s later" },
        { t: 30.0, type: "copy", target: "specs", detail: "\"Stack 31/25 mm\"" },
      ],
    },
  ],
  routeCode: `export const POST = createIntentHandler({
  siteContext: "Product page for the Ando Ridge 2 trail shoe, $148. Sections: buybox, specs, reassurance, reviews.",
  questions: {
    concern: { type: "choice", instructions: "What is the main thing holding this shopper back?",
      criteria: { fit_size: "…", shipping_returns: "…", price: "…", durability: "…", none: "…" } },
    experienced_runner: { type: "noul", instructions: "The shopper cares about technical specs." },
  },
});`,
  clientCode: `const { flags } = useVisitorState();
const concern = ["fit_size", "shipping_returns", "price", "durability"]
  .find((c) => flags[\`concern:\${c}\`] > 0.5);

{concern === "fit_size"         && <SizeGuide />}
{concern === "shipping_returns" && <ShippingAndReturns />}
{concern === "price"            && <PayInThree />}
{concern === "durability"       && <DurabilityReviews />}

<Intent when="experienced_runner"><TechSpecs first /></Intent>
<Intent when="purchase_intent" confidence={0.6}><StickyBuyBar /></Intent>`,
};
