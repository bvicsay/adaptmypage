import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "IntentFlags — semantic feature flags for websites, powered by Jev";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const bars: Array<[string, number]> = [
    ["technical_evaluation", 0.81],
    ["price_comparison", 0.09],
    ["exploring", 0.06],
    ["ready_to_buy", 0.03],
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f2f4f8",
          backgroundImage:
            "linear-gradient(to right, #e1e6ef 1px, transparent 1px), linear-gradient(to bottom, #e1e6ef 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          padding: 64,
          fontFamily: "sans-serif",
          color: "#0c1222",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="3" width="2.5" height="26" rx="1.25" fill="#0c1222" />
              <path d="M8 5h17.5c.9 0 1.5.9 1.1 1.7L24 11l2.6 4.3c.4.8-.2 1.7-1.1 1.7H8V5z" fill="#1b4dff" />
              <rect x="8" y="5" width="6.2" height="12" fill="#fff" fillOpacity="0.32" />
            </svg>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>
              Intent<span style={{ color: "#1b4dff", display: "flex" }}>Flags</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 700 }}>
            <div style={{ fontSize: 60, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.02 }}>
              Your site knows what visitors clicked. Now it can know what they’re trying to do.
            </div>
            <div style={{ fontSize: 26, color: "#33405a", lineHeight: 1.3 }}>
              Semantic feature flags for React, powered by Jev. Open source.
            </div>
          </div>
          <div style={{ fontSize: 24, color: "#6a7691", fontFamily: "monospace" }}>npm install intentflags</div>
        </div>
        <div
          style={{
            width: 340,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "#fff",
            border: "1px solid #d5dbe7",
            borderRadius: 14,
            padding: 24,
            alignSelf: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#6a7691", letterSpacing: 1.5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "#e63b2e" }} />
            LIVE VISITOR STATE
          </div>
          {bars.map(([label, p]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontFamily: "monospace" }}>
                <span>{label}</span>
                <span style={{ color: p > 0.5 ? "#1b4dff" : "#6a7691" }}>{Math.round(p * 100)}%</span>
              </div>
              <div style={{ height: 8, background: "#e9edf4", borderRadius: 999, display: "flex" }}>
                <div style={{ width: `${p * 100}%`, height: 8, background: p > 0.5 ? "#1b4dff" : "#c9d2e6", borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
