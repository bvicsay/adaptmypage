import type { Action, VisitorState } from "adaptmypage";

export interface Change {
  id: string;
  at: number;
  /** What the page did, e.g. "Opened the size guide". */
  what: string;
  detail?: string;
  /** Flag id in `state.flags`, e.g. "concern:fit_size". */
  flag: string;
  confidence: number;
  evidence: string[];
  /** The line of code that made the decision. */
  code: string;
}

export type FrameMessage =
  | { source: "amp"; frame: string; type: "ready" }
  | { source: "amp"; frame: string; type: "state"; state: VisitorState }
  | { source: "amp"; frame: string; type: "action"; action: Action }
  | { source: "amp"; frame: string; type: "change"; change: Change }
  | { source: "amp"; frame: string; type: "done" };

export function postToParent(msg: FrameMessage) {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage(msg, window.location.origin);
}

export function onFrameMessage(handler: (msg: FrameMessage) => void): () => void {
  const listener = (ev: MessageEvent) => {
    if (ev.origin !== window.location.origin) return;
    const d = ev.data as Partial<FrameMessage> | null;
    if (!d || d.source !== "amp" || typeof d.type !== "string") return;
    handler(d as FrameMessage);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
