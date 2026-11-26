import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Nanum_Myeongjo } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSettings } from "@/lib/content";
import { db } from "@/lib/db";
import "./globals.css";

// next/font self-hosts these at build time: no runtime Google Fonts requests.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});
const nanum = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-nanum",
  display: "swap",
  preload: false, // Korean glyph files are large; load them on demand
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const og = s?.ogImageId ? await db.media.findUnique({ where: { id: s.ogImageId } }) : null;
  const title = s?.seoTitle ?? "Caitly Racheal Atelier";
  const description = s?.seoDescription ?? "";
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: "%s · Caitly Racheal Atelier" },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: og
        ? [{ url: og.url, width: og.width ?? undefined, height: og.height ?? undefined, alt: og.alt }]
        : [],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0C" },
    { media: "(prefers-color-scheme: light)", color: "#F6F1E8" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${nanum.variable}`}
      suppressHydrationWarning // next-themes sets data-theme before hydration
    >
      <body>
        <ThemeProvider defaultTheme={settings?.defaultTheme ?? "dark"}>
          {children}
          {/* Whole-page breathing vignette (decorative; see "Breath" in globals.css) */}
          <div className="breath-veil" aria-hidden="true" />
        </ThemeProvider>
      </body>
    </html>
  );
}
