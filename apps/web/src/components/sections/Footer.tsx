import { Wordmark } from "../brand/Logo";

export function Footer() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <Wordmark />
        <ul className="flex flex-wrap gap-x-7 gap-y-2 font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-2">
          <li><a className="hover:text-ink" href="https://www.npmjs.com/package/adaptmypage" data-intent="Footer: npm">npm</a></li>
          <li><a className="hover:text-ink" href="https://github.com/bvicsay/adaptmypage" data-intent="Footer: GitHub">GitHub</a></li>
          <li><a className="hover:text-ink" href="https://vercel.com/i/what-is-jev" data-intent="Footer: What is Jev">What is Jev</a></li>
        </ul>
      </div>
      <p className="mx-auto max-w-6xl px-6 pb-8 font-mono text-[10.5px] text-ink-3 sm:px-10">© 2026 Barnabas Vicsay · MIT · Jev is a model by TypeSafe AI; adaptmypage is not affiliated with TypeSafe, Vercel or OpenRouter.</p>
    </footer>
  );
}
