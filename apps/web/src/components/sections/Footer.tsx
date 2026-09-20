import { Wordmark } from "../brand/Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <Wordmark />
          <p className="mt-2 text-[13px] text-ink-3">Semantic feature flags for websites. Judged by Jev, decided by your code.</p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-ink-2">
          <li><a className="hover:text-ink" href="https://www.npmjs.com/package/intentflags" data-intent="Footer: npm">npm</a></li>
          <li><a className="hover:text-ink" href="https://github.com/bvicsay/adaptmypage" data-intent="Footer: GitHub">GitHub</a></li>
          <li><a className="hover:text-ink" href="https://vercel.com/i/what-is-jev" data-intent="Footer: What is Jev">What is Jev?</a></li>
          <li><a className="hover:text-ink" href="#faq" data-intent="Footer: Privacy">Privacy</a></li>
        </ul>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-8 sm:px-8">
        <p className="font-mono text-[11px] text-ink-3">© 2026 Barnabas Vicsay · MIT · Jev is a model by TypeSafe AI; IntentFlags is not affiliated with TypeSafe or Vercel.</p>
      </div>
    </footer>
  );
}
