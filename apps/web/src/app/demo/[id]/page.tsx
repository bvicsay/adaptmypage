import { notFound } from "next/navigation";
import { DemoCompare } from "@/components/demo/DemoCompare";
import { DemoNav } from "@/components/demo/DemoNav";
import { Footer } from "@/components/sections/Footer";
import { DEMOS, DEMO_IDS, isDemoId } from "@/demos/registry";
import { highlight } from "@/lib/highlight";

export function generateStaticParams() {
  return DEMO_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/demo/[id]">) {
  const { id } = await params;
  const demo = isDemoId(id) ? DEMOS[id] : null;
  return { title: demo ? `${demo.name} demo` : "Demo", description: demo?.tagline };
}

export default async function DemoPage({ params }: PageProps<"/demo/[id]">) {
  const { id } = await params;
  if (!isDemoId(id)) notFound();
  const demo = DEMOS[id];
  const [routeHtml, clientHtml] = await Promise.all([highlight(demo.routeCode, "ts"), highlight(demo.clientCode, "tsx")]);
  return (
    <>
      <DemoNav active={id} />
      <main>
        <header className="mx-auto max-w-[1400px] px-5 pb-10 pt-12 sm:px-8">
          <p className="eyebrow flex items-center gap-2"><span className="dot is-live" aria-hidden />Live demo · {demo.brand}</p>
          <h1 className="display mt-4 max-w-4xl text-[2.4rem] sm:text-[3.4rem]">
            {demo.name}: <span className="serif-italic">same page</span>, different visitors.
          </h1>
          <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-ink-2">{demo.tagline}</p>
        </header>
        <DemoCompare demo={demo} routeHtml={routeHtml} clientHtml={clientHtml} />
      </main>
      <Footer />
    </>
  );
}
