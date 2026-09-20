"use client";

import { AdaptiveProvider } from "./adaptive/adaptive-context";
import { AdaptiveSections } from "./adaptive/AdaptiveSections";
import { PanelShell } from "./panel/PanelShell";
import { Providers } from "./providers";
import { Docs, type DocSnippets } from "./sections/Docs";
import { ExitBar } from "./sections/ExitBar";
import { Faq } from "./sections/Faq";
import { Flags } from "./sections/Flags";
import { Footer } from "./sections/Footer";
import { Hero } from "./sections/Hero";
import { HowItWorks } from "./sections/HowItWorks";
import { Nav } from "./sections/Nav";
import { Pricing } from "./sections/Pricing";
import { Subscribe } from "./sections/Subscribe";

export interface LandingSnippets extends DocSnippets {
  question: string;
  act: string;
}

export function LandingPage({ snippets }: { snippets: LandingSnippets }) {
  return (
    <Providers>
      <AdaptiveProvider>
        <PanelShell>
          <div id="top" />
          <Nav />
          <main>
            <Hero installHtml={snippets.install} />
            <AdaptiveSections
              sections={{
                how: <HowItWorks questionHtml={snippets.question} actHtml={snippets.act} />,
                flags: <Flags />,
                docs: <Docs s={snippets} />,
                pricing: <Pricing />,
                faq: <Faq />,
                subscribe: <Subscribe />,
              }}
            />
          </main>
          <Footer />
          <ExitBar />
        </PanelShell>
      </AdaptiveProvider>
    </Providers>
  );
}
