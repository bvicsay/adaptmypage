import { Demos } from "@/components/sections/Demos";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { How } from "@/components/sections/How";
import { Nav } from "@/components/sections/Nav";
import { Pricing } from "@/components/sections/Pricing";
import { Subscribe } from "@/components/sections/Subscribe";
import { highlightAll } from "@/lib/highlight";
import { SNIPPETS } from "@/lib/snippets";

export default async function Page() {
  const s = await highlightAll(SNIPPETS);
  return (
    <>
      <Nav />
      <main>
        <Hero installHtml={s.install!} />
        <Demos />
        <How useHtml={s.use!} />
        <Pricing />
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
