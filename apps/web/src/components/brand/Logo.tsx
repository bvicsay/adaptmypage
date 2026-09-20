/**
 * IntentFlags mark: a flag whose fabric is a probability meter.
 * The pole is the deterministic code; the fill is the judgment.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="3" width="2.5" height="26" rx="1.25" fill="currentColor" />
      <path d="M8 5h17.5c.9 0 1.5.9 1.1 1.7L24 11l2.6 4.3c.4.8-.2 1.7-1.1 1.7H8V5z" fill="var(--signal)" />
      <rect x="8" y="5" width="6.2" height="12" fill="#fff" fillOpacity="0.32" />
      <rect x="14.2" y="5" width="5" height="12" fill="#fff" fillOpacity="0.16" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark />
      <span className="display text-[1.15rem] tracking-[-0.02em]">
        Intent<span className="text-signal">Flags</span>
      </span>
    </span>
  );
}
