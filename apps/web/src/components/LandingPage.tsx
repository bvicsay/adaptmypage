"use client";

import { AdaptiveProvider } from "./adaptive/adaptive-context";
import { Popups } from "./adaptive/Popups";
import { PanelShell } from "./panel/PanelShell";
import { Providers } from "./providers";
import { Docs } from "./sections/Docs";
import { Flags } from "./sections/Flags";
import { Footer } from "./sections/Footer";
import { Hero } from "./sections/Hero";
import { How } from "./sections/How";
import { Nav } from "./sections/Nav";
import { Pricing } from "./sections/Pricing";
import { Subscribe } from "./sections/Subscribe";

export interface LandingSnippets {
  install: string;
  route: string;
  use: string;
  state: string;
  raw: string;
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
            <How />
            <Flags />
            <Docs s={snippets} />
            <Pricing />
            <Subscribe />
          </main>
          <Footer />
          <Popups />
        </PanelShell>
      </AdaptiveProvider>
    </Providers>
  );
}
