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
// Variable fonts: one file per style instead of one per weight
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const nanum = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: "400", // no bold Korean anywhere, so one weight halves the glyph downloads
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
      // Caitly's chosen share image, or the generated silk-and-name default
      images: og
        ? [{ url: og.url, width: og.width ?? undefined, height: og.height ?? undefined, alt: og.alt }]
        : [{ url: "/og", width: 1200, height: 630, alt: "Caitly Racheal: I breathe life into brands." }],
    },
    twitter: { card: "summary_large_image", title, description, images: og ? [og.url] : ["/og"] },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0C" },
    { media: "(prefers-color-scheme: light)", color: "#F6F1E8" },
  ],
};

// A fixed string (no visitor or admin text), so inlining it is safe.
// Runs before first paint: restores a paused-motion choice, then makes the page
// "assemble" (pieces fly into place) on every visit; the first page of the
// session also gets the name intro. A tap or key while it plays skips both.
// In-site navigations are handled by app/template.tsx. (Tests set sessionStorage
// "atelier-seen" to "*" to turn the assembly off.)
const EARLY = `(function(){var d=document.documentElement;d.classList.add('js');
try{if(localStorage.getItem('atelier-motion')==='paused')d.dataset.motion='paused'}catch(e){}
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('motion');
var p=location.pathname;if(p.indexOf('/admin')===0||d.dataset.motion==='paused')return;
try{var s=sessionStorage;if(JSON.parse(s.getItem('atelier-seen')||'[]')==='*')return;
var first=!s.getItem('atelier-intro');if(first){d.classList.add('intro');s.setItem('atelier-intro','1')}
d.classList.add('assembling');setTimeout(function(){d.classList.remove('assembling')},first?11000:8800);
var t0=Date.now(),skip=function(){if(Date.now()-t0<9000){var o=document.querySelector('[data-intro]');if(o)o.style.display='none';d.classList.add('intro-skip')}
removeEventListener('click',skip);removeEventListener('keydown',skip)};addEventListener('click',skip);addEventListener('keydown',skip);}catch(e){}})();`;

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
        <a className="skip" href="#main">
          Skip to content
        </a>
        <ThemeProvider defaultTheme={settings?.defaultTheme ?? "dark"}>
          {children}
          {/* Whole-page breathing vignette (decorative; see "Breath" in globals.css) */}
          <div className="breath-veil" aria-hidden="true" />
          <div className="grain" aria-hidden="true" />
          {/* While a page assembles itself: design gridlines and a caption narrating it */}
          <div className="guides" aria-hidden="true" />
          <div className="asm-caption" aria-hidden="true">
            <span className="asm-working">{settings?.assembleWorking}</span>
            <span className="asm-done">{settings?.assembleDone}</span>
          </div>
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
