import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt =
  "Green Star Solutions — Perception Studio for the Trades, Las Vegas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a3325",
          color: "#f7f5f0",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="44" height="44" viewBox="0 0 64 64">
            <path
              d="M32 4 C35 21 43 29 60 32 C43 35 35 43 32 60 C29 43 21 35 4 32 C21 29 29 21 32 4 Z"
              fill="#8fd6b4"
            />
          </svg>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
            Green Star Solutions
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
            }}
          >
            We redesign the feeling
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
            }}
          >
            people get when they
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
              color: "#8fd6b4",
              fontStyle: "italic",
            }}
          >
            look at your business.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 26,
            color: "rgba(247, 245, 240, 0.7)",
          }}
        >
          <div style={{ display: "flex" }}>
            Perception · Brand · Website · Conversion
          </div>
          <div style={{ display: "flex" }}>Las Vegas, NV</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
