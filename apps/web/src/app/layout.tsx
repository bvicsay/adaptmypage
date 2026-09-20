import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
});
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://intentflags.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "IntentFlags — semantic feature flags for websites, powered by Jev",
    template: "%s · IntentFlags",
  },
  description:
    "A tiny React SDK that infers what a visitor is trying to do right now and exposes it to your code as a normal feature flag. if (visitor.intent === 'technical_evaluation') …",
  keywords: ["feature flags", "intent", "personalization", "React", "Next.js", "Jev", "TypeSafe", "adaptive UI"],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "IntentFlags",
    title: "IntentFlags — semantic feature flags for websites",
    description: "Your site knows what visitors clicked. Now it can know what they're trying to do.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "IntentFlags" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IntentFlags — semantic feature flags for websites",
    description: "Your site knows what visitors clicked. Now it can know what they're trying to do.",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f2f4f8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
