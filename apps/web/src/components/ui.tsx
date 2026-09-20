"use client";

import type { ReactNode } from "react";

/** Interpolate the confidence heat: uncertain grey-blue → signal blue. */
export function heat(v: number): string {
  const t = Math.max(0, Math.min(1, v));
  const a = [0xc6, 0xc7, 0xbf];
  const b = [0x1b, 0x1f, 0x1a];
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function Meter({ value, className = "", height = "h-1.5", color }: { value: number; className?: string; height?: string; color?: string }) {
  return (
    <div className={`meter ${height} w-full overflow-hidden rounded-full bg-paper-2 ${className}`} role="presentation">
      <i style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, backgroundColor: color ?? heat(value) }} />
    </div>
  );
}

export function Pct({ value, className = "" }: { value: number; className?: string }) {
  return <span className={`font-mono tabular-nums ${className}`}>{Math.round(value * 100)}%</span>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-2 ${className}`}>
      <span className="dot" aria-hidden />
      {children}
    </p>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  lede,
  id,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  id?: string;
}) {
  return (
    <header className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="display mt-5 text-[2.4rem] sm:text-[3.4rem] text-ink">
        {title}
      </h2>
      {lede ? <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-ink-2">{lede}</p> : null}
    </header>
  );
}

export function Button({
  href,
  onClick,
  children,
  variant = "primary",
  className = "",
  type,
  disabled,
  dataIntent,
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  dataIntent?: string;
}) {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-[6px] px-4 text-[0.95rem] font-semibold transition-colors focus-visible:outline-2";
  const styles = {
    primary: "bg-ink text-paper hover:bg-black",
    secondary: "bg-transparent text-ink border border-ink/30 hover:border-ink",
    ghost: "text-ink-2 hover:text-ink hover:bg-paper-2",
  }[variant];
  const cls = `${base} ${styles} ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls} data-intent={dataIntent}>
        {children}
      </a>
    );
  }
  return (
    <button type={type ?? "button"} onClick={onClick} className={cls} disabled={disabled} data-intent={dataIntent}>
      {children}
    </button>
  );
}

export function Code({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`[&>pre]:m-0 ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      data-intent={`Copy: ${text.slice(0, 40)}`}
      className="rounded border border-lime/30 px-2 py-1 font-mono text-[11px] text-lime/80 hover:bg-lime/10 hover:text-lime"
      onClick={async (e) => {
        const btn = e.currentTarget;
        try {
          await navigator.clipboard.writeText(text);
          document.dispatchEvent(new Event("copy"));
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = label), 1200);
        } catch {
          btn.textContent = "Select & copy";
        }
      }}
    >
      {label}
    </button>
  );
}
