import type { SiteSettings } from "@prisma/client";

/** Copyright, social links (plain labels until URLs are set in Settings), Korean tagline. */
export function Footer({ settings }: { settings: SiteSettings }) {
  const socials = [
    ["Instagram", settings.instagram],
    ["TikTok", settings.tiktok],
    ["Etsy", settings.etsy],
  ] as const;
  return (
    <>
      <footer className="footer">
        <span>© {new Date().getFullYear()} Caitly Racheal Atelier</span>
        <span>
          {socials.map(([label, url], i) => (
            <span key={label}>
              {i > 0 && " · "}
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {label}
                </a>
              ) : (
                label
              )}
            </span>
          ))}
        </span>
        <span className="ko" lang="ko">
          {settings.footerTagline}
        </span>
      </footer>
      {settings.footerNote && <p className="footer-note">{settings.footerNote}</p>}
    </>
  );
}
