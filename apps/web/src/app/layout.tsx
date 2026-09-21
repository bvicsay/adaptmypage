import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Inter_Tight, Manrope } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["500", "600"], display: "swap" });
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400", style: ["italic"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adaptmypage.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "adaptmypage — a page that adapts to the person reading it", template: "%s · adaptmypage" },
  description:
    "Semantic feature flags for websites. Your React code reads what a visitor is trying to do, as a normal flag, and changes the page live."
  keywords: ["feature flags", "intent", "personalization", "React", "Next.js", "adaptive UI"],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "adaptmypage",
    title: "adaptmypage — a page that adapts to the person reading it",
    description: "Semantic feature flags for websites. Change your page live to match what each visitor wants.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "adaptmypage" }],
  },
  twitter: { card: "summary_large_image", title: "adaptmypage", description: "A page that adapts to the person reading it." },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#efefea", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${interTight.variable} ${instrumentSerif.variable} ${manrope.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
