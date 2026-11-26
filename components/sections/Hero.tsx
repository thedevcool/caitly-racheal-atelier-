import type { Media, SiteSettings } from "@prisma/client";
import { emphasis } from "@/lib/emphasis";
import { MediaImage } from "@/components/ui/MediaImage";
import { Nav } from "@/components/Nav";

type Props = {
  settings: SiteSettings;
  image: Media | null;
  rooms: { slug: string; navLabel: string }[];
};

export function Hero({ settings, image, rooms }: Props) {
  const firstRoom = rooms[0]?.slug ?? "commission";
  return (
    <header className="hero" id="top">
      {/* LCP element: priority + blur placeholder */}
      <MediaImage media={image} className="hero-img" fill priority sizes="100vw" quality={80} />
      <Nav rooms={rooms} />
      <div className="in wrap">
        <p className="hero-ko ko" lang="ko">
          {settings.heroKorean}
        </p>
        <h1>{emphasis(settings.heroHeadline)}</h1>
        <div className="row">
          <p className="intro">{settings.heroIntro}</p>
          <div className="ctas">
            <a className="btn gold" href="#commission">
              {settings.heroCtaPrimary}
            </a>
            <a className="btn ghost" href={`#${firstRoom}`}>
              {settings.heroCtaSecondary}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
