import Link from "next/link";
import { Wordmark } from "../brand/Logo";
import { DEMOS, DEMO_IDS } from "@/demos/registry";
import type { DemoId } from "@/demos/types";

export function DemoNav({ active }: { active: DemoId }) {
  return (
    <div className="sticky top-0 z-20 border-b border-ink/10 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <nav className="mx-auto flex h-[64px] max-w-[1400px] items-center gap-3 px-5 sm:gap-6 sm:px-8" aria-label="Demos">
        <Link href="/" data-intent="Logo" className="shrink-0"><Wordmark className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" /></Link>
        <ul className="thin-scroll flex min-w-0 flex-1 gap-1 overflow-x-auto sm:justify-center">
          {DEMO_IDS.map((id) => (
            <li key={id}>
              <Link
                href={`/demo/${id}`}
                data-intent={`Demo tab: ${DEMOS[id].name}`}
                className={`whitespace-nowrap rounded-[6px] px-3 py-1.5 text-[13.5px] font-semibold ${id === active ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
              >
                {DEMOS[id].name}
              </Link>
            </li>
          ))}
        </ul>
        <a href="https://github.com/bvicsay/adaptmypage" className="hidden shrink-0 text-[13.5px] font-medium text-ink-2 hover:text-ink sm:inline" data-intent="Nav: GitHub">GitHub</a>
      </nav>
    </div>
  );
}
