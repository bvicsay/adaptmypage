"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createIntentFlags } from "../core/client";
import { initialState } from "../core/schema";
import type { Action, IntentFlagsClient, IntentFlagsOptions, IntentResponse, VisitorState } from "../core/types";

const Ctx = createContext<IntentFlagsClient | null>(null);
const SERVER_STATE = initialState();

export interface IntentFlagsProviderProps extends IntentFlagsOptions {
  children?: ReactNode;
  /** Provide your own client (tests, shared instances). */
  client?: IntentFlagsClient;
}

/**
 * Mounts the collector and makes visitor state available to hooks below it.
 * Place it once, near the root of your app.
 */
export function IntentFlagsProvider({ children, client: given, ...options }: IntentFlagsProviderProps) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [client, setClient] = useState<IntentFlagsClient | null>(given ?? null);

  useEffect(() => {
    if (given) {
      setClient(given);
      return;
    }
    const c = createIntentFlags(optionsRef.current);
    setClient(c);
    return () => c.destroy();
    // options are read once on mount by design; use setContext() for updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [given]);

  useEffect(() => {
    if (client && options.context) client.setContext(options.context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, JSON.stringify(options.context ?? null)]);

  return createElement(Ctx.Provider, { value: client }, children);
}

/** The underlying client, or `null` before mount / outside a provider. */
export function useIntentFlags(): IntentFlagsClient | null {
  return useContext(Ctx);
}

/** The live visitor state. Always defined; starts as the uniform initial state. */
export function useVisitorState(): VisitorState {
  const client = useContext(Ctx);
  const subscribe = useCallback(
    (cb: () => void) => (client ? client.subscribe(() => cb()) : () => {}),
    [client],
  );
  return useSyncExternalStore(
    subscribe,
    () => (client ? client.getState() : SERVER_STATE),
    () => SERVER_STATE,
  );
}

export interface UseIntentOptions {
  /** Confidence needed for `active`. Default 0.6. */
  threshold?: number;
}

export interface IntentFlag {
  /** Flag id as requested. */
  id: string;
  /** 0..1. `0` when the flag does not exist yet. */
  confidence: number;
  /** `confidence >= threshold`. */
  active: boolean;
  /** Whether at least one real evaluation has happened. */
  evaluated: boolean;
  state: VisitorState;
}

/**
 * Read one flag. Built-in ids: every intent (`technical_evaluation`), every
 * next action (`next:view_pricing`), and the scalars `expertise`, `friction`,
 * `purchase_intent`, `abandon_risk`. Custom server questions appear by id.
 */
export function useIntent(id: string, options: UseIntentOptions = {}): IntentFlag {
  const state = useVisitorState();
  const threshold = options.threshold ?? 0.6;
  return useMemo(() => {
    const confidence = state.flags[id] ?? 0;
    return {
      id,
      confidence,
      active: confidence >= threshold,
      evaluated: state.meta.source !== "initial",
      state,
    };
  }, [state, id, threshold]);
}

export interface IntentProps {
  /** One flag id, or several (any match). */
  when: string | string[];
  /** Confidence threshold. Default 0.6. */
  confidence?: number;
  /** Render children when the flag is NOT active. */
  not?: boolean;
  /** Rendered when the condition is false. */
  fallback?: ReactNode;
  children?: ReactNode;
}

/** Declarative flag: `<Intent when="price_comparison" confidence={0.7}>…</Intent>` */
export function Intent({ when, confidence = 0.6, not = false, fallback = null, children }: IntentProps) {
  const state = useVisitorState();
  const ids = Array.isArray(when) ? when : [when];
  const active = ids.some((id) => (state.flags[id] ?? 0) >= confidence);
  const show = not ? !active : active;
  return createElement(FragmentLike, null, show ? children : fallback);
}

function FragmentLike({ children }: { children?: ReactNode }) {
  return children as unknown as ReturnType<typeof createElement>;
}

/** Live list of collected actions in this page, oldest first. */
export function useIntentActions(limit = 60): Action[] {
  const client = useContext(Ctx);
  const [actions, setActions] = useState<Action[]>(() => (client ? client.getActions().slice(-limit) : []));
  useEffect(() => {
    if (!client) return;
    setActions(client.getActions().slice(-limit));
    return client.subscribeActions(() => setActions(client.getActions().slice(-limit)));
  }, [client, limit]);
  return actions;
}

export interface IntentDebugInfo {
  state: VisitorState;
  actions: Action[];
  lastResponse: IntentResponse | null;
  evaluating: boolean;
  /** Force an evaluation now. */
  evaluate: () => Promise<VisitorState>;
  /** Record a custom event. */
  track: (target: string, detail?: string) => void;
}

/** Everything a debugging HUD needs. */
export function useIntentDebug(): IntentDebugInfo {
  const client = useContext(Ctx);
  const state = useVisitorState();
  const actions = useIntentActions();
  const [evaluating, setEvaluating] = useState(false);
  useEffect(() => {
    if (!client) return;
    const t = setInterval(() => setEvaluating(client.isEvaluating()), 250);
    return () => clearInterval(t);
  }, [client]);
  return {
    state,
    actions,
    lastResponse: client?.getLastResponse() ?? null,
    evaluating,
    evaluate: () => (client ? client.evaluate(true) : Promise.resolve(state)),
    track: (target, detail) => client?.track(target, detail),
  };
}
