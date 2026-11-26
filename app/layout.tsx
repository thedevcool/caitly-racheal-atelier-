import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Nanum_Myeongjo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { Cursor } from "@/components/motion/Cursor";
import { RouteProgress } from "@/components/motion/RouteProgress";
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

// A fixed string (no visitor or admin text), so inlining it is safe.
const EARLY = `(function(){var d=document.documentElement;d.classList.add('js');
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('motion');
try{if(location.pathname.indexOf('/admin')!==0&&!sessionStorage.getItem('atelier-intro')){
d.classList.add('intro');sessionStorage.setItem('atelier-intro','1');
addEventListener('click',function s(){var o=document.querySelector('[data-intro]');if(o)o.style.display='none';removeEventListener('click',s)});}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${nanum.variable}`}
      suppressHydrationWarning // next-themes sets data-theme before hydration
    >
      <head>
        {/* Before first paint: is motion OK, and should the once-per-session intro play? */}
        <script dangerouslySetInnerHTML={{ __html: EARLY }} />
      </head>
      <body>
        <ThemeProvider defaultTheme={settings?.defaultTheme ?? "dark"}>
          {children}
          {/* Whole-page breathing vignette (decorative; see "Breath" in globals.css) */}
          <div className="breath-veil" aria-hidden="true" />
          <div className="grain" aria-hidden="true" />
          <div className="intro-overlay" aria-hidden="true" data-intro>
            <div className="intro-name">
              <b>Caitly Racheal</b>
              <span lang="ko">아틀리에</span>
              <i className="intro-line" />
            </div>
          </div>
          <RouteProgress />
          <Cursor enabled={settings?.cursorEnabled ?? true} />
          <MotionRoot />
          {/* Only on Vercel, where the analytics endpoint exists */}
          {process.env.VERCEL && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  );
}
