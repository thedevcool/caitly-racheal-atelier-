import { ImageResponse } from "next/og";

/**
 * Default share image (brief §10): the champagne silk with her name.
 * Used until Caitly picks her own in Settings. Rendered once at build time.
 */
export const dynamic = "force-static";
export const runtime = "edge";

export async function GET() {
  const [silk, serif, italic] = await Promise.all([
    fetch(new URL("./silk.jpg", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./cormorant-500.woff", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./cormorant-500-italic.woff", import.meta.url)).then((r) => r.arrayBuffer()),
  ]);
  const src = `data:image/jpeg;base64,${Buffer.from(silk).toString("base64")}`;
  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: "flex", position: "relative", background: "#0B0B0C" }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={src} width={1200} height={630} style={{ position: "absolute", inset: 0 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(100deg, rgba(11,11,12,.92) 0%, rgba(11,11,12,.6) 50%, rgba(11,11,12,.1) 85%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 90,
          display: "flex",
          flexDirection: "column",
          color: "#EDE6DA",
        }}
      >
        <div style={{ fontFamily: "Cormorant", fontSize: 104, lineHeight: 0.9, letterSpacing: -2 }}>
          Caitly Racheal
        </div>
        <div style={{ display: "flex", fontFamily: "Cormorant", fontSize: 46, marginTop: 18 }}>
          <span>I breathe&nbsp;</span>
          <span style={{ fontFamily: "Cormorant Italic", color: "#D4B47A" }}>life</span>
          <span>&nbsp;into brands.</span>
        </div>
        <div style={{ fontSize: 20, letterSpacing: 3, marginTop: 26, color: "#B3AA9C" }}>
          CREATIVE DIRECTOR · VISUAL STORYTELLER
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Cormorant", data: serif, weight: 500, style: "normal" },
        { name: "Cormorant Italic", data: italic, weight: 500, style: "italic" },
      ],
    },
  );
}
