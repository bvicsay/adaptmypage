import Link from "next/link";
import { Wordmark } from "../brand/Logo";

export function Nav() {
  return (
    <div className="sticky top-0 z-20 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6 sm:px-10" aria-label="Main">
        <Link href="/" data-intent="Logo"><Wordmark /></Link>
        <div className="flex items-center gap-6 text-[0.9rem] font-medium text-ink-2">
          <Link href="/demo/pricing" className="hover:text-ink" data-intent="Nav: Demos">Demos</Link>
          <a href="#pricing" className="hidden hover:text-ink sm:inline" data-intent="Nav: Pricing">Pricing</a>
          <a href="https://github.com/bvicsay/adaptmypage" className="hidden hover:text-ink sm:inline" data-intent="Nav: GitHub">GitHub</a>
          <Link href="/demo/pricing" className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-ink px-3.5 text-[13px] font-semibold text-paper hover:bg-black" data-intent="Nav: See it live">
            <span className="dot" aria-hidden />See it live
          </Link>
        </div>
      </nav>
    </div>
  );
}
