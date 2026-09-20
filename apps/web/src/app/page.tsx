import { LandingPage, type LandingSnippets } from "@/components/LandingPage";
import { highlightAll } from "@/lib/highlight";
import { SNIPPETS } from "@/lib/snippets";

export default async function Page() {
  const snippets = (await highlightAll(SNIPPETS)) as unknown as LandingSnippets;
  return <LandingPage snippets={snippets} />;
}
