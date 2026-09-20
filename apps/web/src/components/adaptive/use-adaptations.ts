"use client";

import { useIntentActions, useVisitorState } from "adaptmypage";
import type { Action, IntentId, VisitorState } from "adaptmypage";
import { useMemo } from "react";

export interface Reason {
  flag: string;
  confidence: number;
  /** Short past-tense phrases: "copied the install command". */
  evidence: string[];
}

export type PopupKind = "welcome" | "technical" | "pricing" | "support" | "ready" | "friction" | "leaving" | "expert";

export interface Popup {
  id: string;
  kind: PopupKind;
  title: string;
  body: string;
  reason: Reason | null;
  action?: { label: string; href: string };
}

export interface Adaptations {
  evaluated: boolean;
  /** The italic phrase in the headline: "This page is ___." */
  heroPhrase: { text: string; why: string | null };
  /** One mono status line under the headline. */
  status: string;
  cta: { label: string; href: string; why: string | null };
  /** One sentence introducing the docs, tuned to expertise. */
  docsLine: { text: string; why: string | null };
  /** Pop-ups the current state calls for (deduped by the context). */
  wanted: Popup[];
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
const because = (flag: string, p: number) => `because Jev read ${flag} ${pct(p)}`;

const PHRASES: Record<IntentId, string> = {
  insufficient_signal: "adapting to you.",
  exploring: "introducing itself.",
  technical_evaluation: "showing you the code.",
  price_comparison: "showing you the price.",
  ready_to_buy: "getting out of your way.",
  seeking_support: "answering your questions.",
};

/** Turn the last few semantic events into plain phrases, favouring ones relevant to the flag. */
export function describeEvidence(actions: Action[], flag: string): string[] {
  const rel: Record<string, RegExp> = {
    technical_evaluation: /docs|code|api|route|install|server|hook|payload|github/i,
    price_comparison: /pric|cost|plan|free|access/i,
    seeking_support: /faq|question|help|support|ask|github/i,
    ready_to_buy: /install|access|email|subscribe|update|sign/i,
    friction: /hesitation|rage|scroll_return|idle/i,
    abandon_risk: /exit_intent|idle|tab_hidden/i,
    expertise: /code|docs|copy|payload|route|server/i,
  };
  const re = rel[flag] ?? /.^/;
  const phrases: Array<{ t: number; text: string; hit: boolean }> = [];
  for (const a of actions.slice(-24)) {
    const target = (a.target ?? "").replace(/^(button|link|code|heading|section|input|div|span|summary|label):/, "").replace(/^(Docs tab|Nav|Hero|Pricing|Footer|Popup|Panel tab|Primary CTA|Subscribe): /, "");
    let text: string | null = null;
    switch (a.type) {
      case "copy":
        text = /install/i.test(target) ? "copied the install command" : "copied a code sample";
        break;
      case "hover":
        if (/^code|createIntent|useIntent|npm/i.test(a.target ?? "")) text = `read a code sample for ${a.detail ?? "a while"}`;
        else if (a.detail && parseFloat(a.detail) >= 1.5) text = `hovered “${target}” for ${a.detail}`;
        break;
      case "section_exit":
        if (a.detail && parseFloat(a.detail) >= 3) text = `spent ${a.detail} in ${target}`;
        break;
      case "scroll_return":
        text = `came back to ${target}`;
        break;
      case "section_enter":
        if (target && target !== "hero") text = `opened the ${target} section`;
        break;
      case "click":
        if (!/^area:/.test(a.target ?? "")) text = `clicked “${target}”`;
        break;
      case "select_text":
        text = `selected text in ${target}`;
        break;
      case "hesitation":
        text = `hovered “${target}” without clicking`;
        break;
      case "rage_click":
        text = `clicked “${target}” repeatedly`;
        break;
      case "exit_intent":
        text = "moved toward the tab bar";
        break;
      case "idle":
        text = "paused for a while";
        break;
      case "form_focus":
      case "form_input":
        text = "started the email field";
        break;
      case "tab_hidden":
        text = "switched tabs";
        break;
      default:
        break;
    }
    if (text) phrases.push({ t: a.t, text, hit: re.test(`${a.type} ${a.target ?? ""}`) });
  }
  const seen = new Set<string>();
  const uniq = phrases.reverse().filter((p) => (seen.has(p.text) ? false : (seen.add(p.text), true)));
  const hits = uniq.filter((p) => p.hit).slice(0, 3);
  const rest = uniq.filter((p) => !p.hit).slice(0, Math.max(0, 2 - hits.length));
  return [...hits, ...rest].map((p) => p.text);
}

function reason(state: VisitorState, actions: Action[], flag: string, confidence: number): Reason {
  return { flag, confidence, evidence: describeEvidence(actions, flag) };
}

export function deriveAdaptations(state: VisitorState, actions: Action[]): Adaptations {
  const evaluated = state.meta.source !== "initial";
  const i = state.intent;
  const strong = evaluated && i.confidence >= 0.55 && i.value !== "insufficient_signal";

  const heroPhrase = strong
    ? { text: PHRASES[i.value], why: because(i.value, i.confidence) }
    : { text: PHRASES.insufficient_signal, why: null };

  const status = !evaluated
    ? "reading how you browse…"
    : `${i.value} ${pct(i.confidence)} · next ${state.nextAction.value} ${pct(state.nextAction.confidence)}`;

  let cta: Adaptations["cta"] = { label: "Install it", href: "#docs", why: null };
  if (strong) {
    if (i.value === "technical_evaluation") cta = { label: "Read the route", href: "#docs", why: because(i.value, i.confidence) };
    if (i.value === "price_comparison") cta = { label: "See the cost", href: "#pricing", why: because(i.value, i.confidence) };
    if (i.value === "ready_to_buy") cta = { label: "Get early access", href: "#subscribe", why: because(i.value, i.confidence) };
    if (i.value === "seeking_support") cta = { label: "Ask on GitHub", href: "https://github.com/bvicsay/adaptmypage/discussions", why: because(i.value, i.confidence) };
  }

  let docsLine: Adaptations["docsLine"] = { text: "One route on the server, one hook in the client.", why: null };
  if (evaluated && state.expertise < 0.38) docsLine = { text: "You don’t need to know how the model works. Copy these two files and it runs.", why: because("expertise", state.expertise) };
  if (evaluated && state.expertise >= 0.72) docsLine = { text: "Web-standard handler, dependency-free client, ~10 KB. Payload shapes are in the README.", why: because("expertise", state.expertise) };

  const wanted: Popup[] = [];
  if (evaluated) {
    wanted.push({
      id: "welcome",
      kind: "welcome",
      title: "This page is reading how you browse.",
      body: "Every few seconds Jev judges what you’re trying to do. When the page changes, a card like this one tells you what changed and why.",
      reason: null,
      action: { label: "Open the live panel", href: "#panel" },
    });
  }
  if (strong && i.value === "technical_evaluation") {
    wanted.push({
      id: "technical",
      kind: "technical",
      title: "You’re evaluating the API.",
      body: "So the headline and the button now point at the code. The whole integration is one route and one hook.",
      reason: reason(state, actions, "technical_evaluation", i.confidence),
      action: { label: "Read the route", href: "#docs" },
    });
  }
  if (strong && i.value === "price_comparison") {
    wanted.push({
      id: "pricing",
      kind: "pricing",
      title: "You’re checking what it costs.",
      body: "The SDK is free and open source. A judgment with your own Jev key is about $0.00007.",
      reason: reason(state, actions, "price_comparison", i.confidence),
      action: { label: "See pricing", href: "#pricing" },
    });
  }
  if (strong && i.value === "seeking_support") {
    wanted.push({
      id: "support",
      kind: "support",
      title: "Looking for an answer?",
      body: "The README covers payloads, privacy and providers. Anything else, open a discussion.",
      reason: reason(state, actions, "seeking_support", i.confidence),
      action: { label: "Ask on GitHub", href: "https://github.com/bvicsay/adaptmypage/discussions" },
    });
  }
  if (evaluated && ((i.value === "ready_to_buy" && i.confidence >= 0.5) || (state.nextAction.value === "sign_up" && state.nextAction.confidence >= 0.45))) {
    wanted.push({
      id: "ready",
      kind: "ready",
      title: "Ready to try it?",
      body: "Install today, or leave your email for the hosted API.",
      reason: reason(state, actions, i.value === "ready_to_buy" ? "ready_to_buy" : "next:sign_up", i.value === "ready_to_buy" ? i.confidence : state.nextAction.confidence),
      action: { label: "Get early access", href: "#subscribe" },
    });
  }
  if (evaluated && state.friction >= 0.55) {
    wanted.push({
      id: "friction",
      kind: "friction",
      title: "The short version.",
      body: "Install the package. Add one API route. Write if (useIntent(\"price_comparison\").active) like any other flag.",
      reason: reason(state, actions, "friction", state.friction),
      action: { label: "See the two files", href: "#docs" },
    });
  }
  if (evaluated && state.abandonRisk >= 0.6 && i.value !== "ready_to_buy") {
    wanted.push({
      id: "leaving",
      kind: "leaving",
      title: "Before you go.",
      body: "One email when the hosted API opens. Nothing else.",
      reason: reason(state, actions, "abandon_risk", state.abandonRisk),
      action: { label: "Get the launch email", href: "#subscribe" },
    });
  }
  if (evaluated && state.expertise >= 0.75 && actions.length > 6) {
    wanted.push({
      id: "expert",
      kind: "expert",
      title: "You read like an engineer.",
      body: "The docs line switched to the technical version and the raw Jev answer is shown alongside the normalised state.",
      reason: reason(state, actions, "expertise", state.expertise),
      action: { label: "See the payloads", href: "#docs" },
    });
  }

  return { evaluated, heroPhrase, status, cta, docsLine, wanted };
}

export function useAdaptations(): Adaptations {
  const state = useVisitorState();
  const actions = useIntentActions(40);
  return useMemo(() => deriveAdaptations(state, actions), [state, actions]);
}
