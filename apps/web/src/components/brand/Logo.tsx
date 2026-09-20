/** The flag mark: a pole (your deterministic code) and a fabric that is a probability meter (the judgment). */
export function LogoMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="3" width="2.5" height="26" rx="1.25" fill="currentColor" />
      <path d="M8 5h17.5c.9 0 1.5.9 1.1 1.7L24 11l2.6 4.3c.4.8-.2 1.7-1.1 1.7H8V5z" fill="currentColor" />
      <rect x="8" y="5" width="6.2" height="12" fill="var(--lime)" fillOpacity="0.9" />
      <rect x="14.2" y="5" width="5" height="12" fill="var(--lime)" fillOpacity="0.45" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-ink ${className ?? ""}`}>
      <LogoMark />
      <span className="display text-[1.05rem] tracking-[-0.03em]">adaptmypage</span>
    </span>
  );
}
