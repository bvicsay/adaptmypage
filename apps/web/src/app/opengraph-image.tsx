import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "adaptmypage — a page that adapts to the person reading it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#efefea", padding: 72, fontFamily: "sans-serif", color: "#1b1f1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, letterSpacing: 3, color: "#4a4f49", fontFamily: "monospace" }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: "#d4f23f" }} />
          LIVE ON THIS PAGE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: -5, lineHeight: 0.98, display: "flex", flexDirection: "column" }}>
            <span>This page is</span>
            <span style={{ fontStyle: "italic", fontFamily: "serif", fontWeight: 400, letterSpacing: -2 }}>adapting to you.</span>
          </div>
          <div style={{ fontSize: 28, color: "#4a4f49", maxWidth: 820, lineHeight: 1.35 }}>Semantic feature flags for websites, powered by Jev. Open source.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700, letterSpacing: -1.5 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="3" width="2.5" height="26" rx="1.25" fill="#1b1f1a" />
              <path d="M8 5h17.5c.9 0 1.5.9 1.1 1.7L24 11l2.6 4.3c.4.8-.2 1.7-1.1 1.7H8V5z" fill="#1b1f1a" />
              <rect x="8" y="5" width="6.2" height="12" fill="#d4f23f" />
            </svg>
            adaptmypage
          </div>
          <div style={{ background: "#1c2418", color: "#cfef5a", fontFamily: "monospace", fontSize: 24, padding: "14px 22px", borderRadius: 6 }}>npm install adaptmypage</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
