import type { Media, SiteSettings } from "@prisma/client";
import { emphasisWords } from "@/lib/emphasis";
import { MediaImage } from "@/components/ui/MediaImage";
import { Nav } from "@/components/Nav";

type Props = {
  settings: SiteSettings;
  image: Media | null;
  rooms: { slug: string; navLabel: string; name: string; korean: string }[];
};

export function Hero({ settings, image, rooms }: Props) {
  const firstRoom = rooms[0]?.slug ?? "commission";
  return (
    <header className="hero" id="top">
      {/*
        Four layers, one motion each (a CSS animation would override an inline
        transform on the same element): scroll parallax → pointer/tilt shift →
        breath → the image's own Ken Burns drift. LCP image: priority + blur.
      */}
      <div className="hero-parallax" data-hero-parallax>
        <div className="hero-shift" data-hero-shift>
          <div className="hero-media">
            <MediaImage
              media={image}
              className="hero-img"
              fill
              priority
              fetchPriority="high"
              sizes="100vw"
              quality={80}
            />
          </div>
        </div>
      </div>
      <Nav rooms={rooms} />
      <div className="in wrap">
        <p className="hero-ko ko" lang="ko">
          {settings.heroKorean}
        </p>
        {/* Words are server-rendered spans so the word-by-word reveal is pure CSS (no flash, no JS wait) */}
        <h1>
          {emphasisWords(settings.heroHeadline).map((w, i) => (
            <span key={i}>
              {w.space && " "}
              <span className="hw">
                <span className="hw-i" style={{ "--i": i } as React.CSSProperties}>
                  {w.em ? <em>{w.word}</em> : w.word}
                </span>
              </span>
            </span>
          ))}
        </h1>
        <div className="row">
          <p className="intro">{settings.heroIntro}</p>
          <div className="ctas">
            <a className="btn gold" href="#commission" data-magnetic>
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
