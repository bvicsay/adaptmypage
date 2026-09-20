import { SectionHeader } from "../ui";

export function How({ useHtml }: { useHtml: string }) {
  return (
    <section id="how">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 py-28 sm:px-10 lg:grid-cols-2 lg:gap-20">
        <SectionHeader
          eyebrow="How it works"
          title={<>Watch. Ask Jev.<br /><span className="serif-italic">Change</span> the page.</>}
          lede="The SDK collects semantic events. One route asks Jev typed questions about them and gets probabilities back in ~300 ms. Your code reads the answers as normal flags. No generated text, nothing to parse."
        />
        <div className="card self-center p-4">
          <p className="font-mono text-[11.5px] text-ink-2">the whole integration</p>
          <div className="mt-2" dangerouslySetInnerHTML={{ __html: useHtml }} />
        </div>
      </div>
    </section>
  );
}
