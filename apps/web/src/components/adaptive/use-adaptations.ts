"use client";

import { useVisitorState } from "intentflags";
import type { VisitorState } from "intentflags";
import { useEffect, useMemo, useRef, useState } from "react";

export type SectionId = "how" | "flags" | "docs" | "pricing" | "faq" | "subscribe";
export const DEFAULT_ORDER: SectionId[] = ["how", "flags", "docs", "pricing", "faq", "subscribe"];

export type CtaVariant = "build" | "docs" | "pricing" | "faq" | "access";
export type DocsMode = "guided" | "standard" | "expert";

export interface Adaptations {
  order: SectionId[];
  /** Why a section was moved, by id. */
  moved: Partial<Record<SectionId, string>>;
  cta: { variant: CtaVariant; label: string; href: string; reason: string };
  docsMode: DocsMode;
  showQuickVersion: boolean;
  showExitBar: boolean;
  evaluated: boolean;
}

export interface AdaptationEvent {
  id: number;
  at: number;
  text: string;
  reason: string;
}

const REORDER_THRESHOLD = 0.55;
const pct = (n: number) => `${Math.round(n * 100)}%`;

function deriveOrder(state: VisitorState, prev: SectionId[]): { order: SectionId[]; moved: Partial<Record<SectionId, string>> } {
  if (state.meta.source === "initial") return { order: DEFAULT_ORDER, moved: {} };
  const i = state.intent;
  const moved: Partial<Record<SectionId, string>> = {};
  let first: SectionId | null = null;
  let second: SectionId | null = null;
  if (i.confidence >= REORDER_THRESHOLD) {
    switch (i.value) {
      case "technical_evaluation":
        first = "docs";
        second = "flags";
        moved.docs = `technical_evaluation ${pct(i.confidence)}`;
        break;
      case "price_comparison":
        first = "pricing";
        moved.pricing = `price_comparison ${pct(i.confidence)}`;
        break;
      case "seeking_support":
        first = "faq";
        moved.faq = `seeking_support ${pct(i.confidence)}`;
        break;
      case "ready_to_buy":
        first = "subscribe";
        second = "pricing";
        moved.subscribe = `ready_to_buy ${pct(i.confidence)}`;
        break;
      default:
        break;
    }
  }
  if (!first) {
    // sticky: keep the previous arrangement rather than snapping back on a weak reading
    return { order: prev, moved: {} };
  }
  const rest = DEFAULT_ORDER.filter((s) => s !== first && s !== second);
  const order = [first, ...(second ? [second] : []), ...rest] as SectionId[];
  return { order, moved };
}

function deriveCta(state: VisitorState): Adaptations["cta"] {
  const i = state.intent;
  const n = state.nextAction;
  if (state.meta.source !== "initial") {
    if (i.value === "ready_to_buy" && i.confidence >= 0.5)
      return { variant: "access", label: "Get early access", href: "#subscribe", reason: `ready_to_buy ${pct(i.confidence)}` };
    if (i.value === "price_comparison" && i.confidence >= 0.5)
      return { variant: "pricing", label: "See what it costs", href: "#pricing", reason: `price_comparison ${pct(i.confidence)}` };
    if (i.value === "seeking_support" && i.confidence >= 0.5)
      return { variant: "faq", label: "Read the FAQ", href: "#faq", reason: `seeking_support ${pct(i.confidence)}` };
    if (i.value === "technical_evaluation" && i.confidence >= 0.5)
      return { variant: "docs", label: "Open the API reference", href: "#docs", reason: `technical_evaluation ${pct(i.confidence)}` };
    if (n.value === "sign_up" && n.confidence >= 0.4)
      return { variant: "access", label: "Get early access", href: "#subscribe", reason: `next:sign_up ${pct(n.confidence)}` };
  }
  return { variant: "build", label: "Start building", href: "#docs", reason: "default" };
}

function deriveDocsMode(state: VisitorState): DocsMode {
  if (state.meta.source === "initial") return "standard";
  if (state.expertise < 0.38) return "guided";
  if (state.expertise >= 0.7) return "expert";
  return "standard";
}

/** Turns the live visitor state into concrete page decisions, with hysteresis and a change log. */
export function useAdaptations(): { adaptations: Adaptations; log: AdaptationEvent[] } {
  const state = useVisitorState();
  const prevOrder = useRef<SectionId[]>(DEFAULT_ORDER);
  const exitShown = useRef(false);
  const [log, setLog] = useState<AdaptationEvent[]>([]);
  const prev = useRef<Adaptations | null>(null);
  const counter = useRef(0);

  const adaptations = useMemo<Adaptations>(() => {
    const { order, moved } = deriveOrder(state, prevOrder.current);
    const cta = deriveCta(state);
    const docsMode = deriveDocsMode(state);
    const evaluated = state.meta.source !== "initial";
    const showQuickVersion = evaluated && state.friction >= 0.55;
    const showExitBar = evaluated && state.abandonRisk >= 0.6 && state.intent.value !== "ready_to_buy";
    return { order, moved, cta, docsMode, showQuickVersion, showExitBar, evaluated };
  }, [state]);

  useEffect(() => {
    prevOrder.current = adaptations.order;
    const p = prev.current;
    const entries: Array<Omit<AdaptationEvent, "id" | "at">> = [];
    if (p) {
      if (p.order.join() !== adaptations.order.join()) {
        const first = adaptations.order[0];
        entries.push({
          text: `Moved “${SECTION_LABELS[first]}” to the top`,
          reason: adaptations.moved[first] ?? "intent changed",
        });
      }
      if (p.cta.label !== adaptations.cta.label) {
        entries.push({ text: `Primary button → “${adaptations.cta.label}”`, reason: adaptations.cta.reason });
      }
      if (p.docsMode !== adaptations.docsMode) {
        entries.push({
          text: `Docs switched to ${adaptations.docsMode} mode`,
          reason: `expertise ${pct(state.expertise)}`,
        });
      }
      if (!p.showQuickVersion && adaptations.showQuickVersion) {
        entries.push({ text: "Showing the 30-second version", reason: `friction ${pct(state.friction)}` });
      }
      if (!p.showExitBar && adaptations.showExitBar && !exitShown.current) {
        exitShown.current = true;
        entries.push({ text: "Offered the launch email before leaving", reason: `abandon_risk ${pct(state.abandonRisk)}` });
      }
    }
    prev.current = adaptations;
    if (entries.length) {
      setLog((l) => [...entries.map((e) => ({ ...e, id: ++counter.current, at: Date.now() })), ...l].slice(0, 40));
    }
  }, [adaptations, state.expertise, state.friction, state.abandonRisk]);

  return { adaptations, log };
}

export const SECTION_LABELS: Record<SectionId, string> = {
  how: "How it works",
  flags: "Intent flags",
  docs: "API reference",
  pricing: "Pricing",
  faq: "FAQ",
  subscribe: "Early access",
};
