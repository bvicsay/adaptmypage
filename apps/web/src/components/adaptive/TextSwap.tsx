"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Swaps text with a clear, smooth motion: the old text lifts out, the new text
 * rises in, and an optional caption says why. Respects reduced motion via CSS.
 */
export function TextSwap({
  text,
  why,
  as: Tag = "span",
  className = "",
  whyClassName = "",
}: {
  text: string;
  /** Shown under the text for a few seconds after a change. */
  why?: string | null;
  as?: "span" | "em" | "p" | "h1" | "div";
  className?: string;
  whyClassName?: string;
}) {
  const [shown, setShown] = useState(text);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [showWhy, setShowWhy] = useState(false);
  const first = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (text === shown) return;
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    setPhase("out");
    timers.current.push(
      setTimeout(() => {
        setShown(text);
        setPhase("in");
        if (why) setShowWhy(true);
      }, 260),
      setTimeout(() => setPhase("idle"), 700),
      setTimeout(() => setShowWhy(false), 7000),
    );
    return () => {
      for (const t of timers.current) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <Tag className={`swap-wrap ${className}`} data-phase={phase}>
      <span className="swap-text" key={shown}>
        {shown}
      </span>
      {why ? (
        <span className={`swap-why ${showWhy ? "is-visible" : ""} ${whyClassName}`} aria-live="polite">
          {showWhy ? why : ""}
        </span>
      ) : null}
    </Tag>
  );
}
