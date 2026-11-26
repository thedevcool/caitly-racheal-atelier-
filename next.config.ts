import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";
const blob = "https://*.public.blob.vercel-storage.com";

// 'unsafe-inline' for scripts covers Next's inline bootstrap, the theme script
// and the early motion script without forcing every page to render dynamically
// (nonces would). Everything else is tightly listed.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${blob}`,
  `media-src 'self' blob: ${blob}`,
  "font-src 'self' data:",
  `connect-src 'self' ${blob} https://*.vercel-storage.com https://vercel.com https://challenges.cloudflare.com https://va.vercel-scripts.com`,
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Device orientation stays allowed for the hero's tilt effect
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
