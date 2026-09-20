import { SectionHeader } from "../ui";

const QA: Array<[string, React.ReactNode]> = [
  [
    "What exactly is sent to the model?",
    <>
      A compact snapshot: the page path, referrer host and UTM tags, device class, how long the session has run, which sections were in view and for how long, and a timeline of semantic
      events such as <code className="inline">click button:Compare plans</code> or <code className="inline">copy code:npm install intentflags</code>. Never mouse coordinates, keystrokes,
      or form values. The full shape is in the Payloads tab.
    </>,
  ],
  [
    "What is Jev, and why not a normal LLM?",
    <>
      Jev is TypeSafe AI’s “System One” model. You give it a state and typed questions; it returns probabilities and stops. No generated text, no JSON to parse or retry, 70–500 ms per
      request, and it answers every question in one pass. A chat model can be coaxed into this, but you pay for output tokens, wait for streaming, and validate the shape yourself.
    </>,
  ],
  [
    "Do I need a Jev key?",
    <>
      For real judgments, yes — from TypeSafe directly, through Vercel AI Gateway, or through OpenRouter. Without one the server runs a transparent rules-based evaluator so local development and tests work,
      and every response is labelled <code className="inline">source: "heuristic"</code> so you can’t mistake it for the model.
    </>,
  ],
  [
    "Does it work with the Next.js App Router and SSR?",
    <>
      Yes. On the server every hook returns the uniform initial state, so there is no hydration mismatch. The first judgment arrives about a second after the page becomes interactive,
      and the previous state of the session is restored from <code className="inline">sessionStorage</code> so navigations don’t reset to zero.
    </>,
  ],
  [
    "Will it slow my site down?",
    <>
      The client is about 10 KB gzipped, uses passive listeners and an IntersectionObserver, and sends one small request every 4–20 seconds while the visitor is active. Judgments stop
      when the tab is hidden or the visitor goes idle.
    </>,
  ],
  [
    "Can I define my own flags?",
    <>
      Add questions to <code className="inline">createIntentHandler({"{ questions }"})</code>. A yes/no question becomes one flag, a scale becomes a 0–1 flag, and a choice becomes one flag
      per option. They show up in <code className="inline">useIntent()</code> immediately.
    </>,
  ],
  [
    "How does this sit with GDPR and consent?",
    <>
      The visitor id is a random value in the browser’s own storage — no cookies, no fingerprinting, no third-party requests from the page. Pass{" "}
      <code className="inline">disabled</code> to the provider until consent is given if your policy requires it, and use the gateway’s zero-data-retention option if you route through Vercel.
    </>,
  ],
  [
    "Is it open source?",
    <>MIT. The SDK, this landing page and the server handler live in one repository; this page is the reference deployment.</>,
  ],
];

export function Faq() {
  return (
    <section id="faq" data-section="faq" className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <SectionHeader eyebrow="FAQ" title="The questions engineers ask before installing." />
        <dl className="mt-10 divide-y divide-line border-y border-line">
          {QA.map(([q, a]) => (
            <details key={q} className="group py-4" data-intent={`FAQ: ${q}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.02rem] font-medium text-ink">
                {q}
                <span className="font-mono text-ink-3 transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <dd className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-ink-2">{a}</dd>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}
