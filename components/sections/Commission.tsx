import type { Media, SiteSettings } from "@prisma/client";
import { emphasis } from "@/lib/emphasis";
import { MediaImage } from "@/components/ui/MediaImage";
import { CommissionForm } from "./CommissionForm";

type Props = {
  settings: SiteSettings;
  image: Media | null;
  services: { slug: string; service: string }[];
};

/** "Let's make you unforgettable." over the wide silk, with a frosted-glass form card. */
export function Commission({ settings, image, services }: Props) {
  return (
    <section className="band contact" id="commission" aria-labelledby="commission-title">
      <MediaImage media={image} alt="" className="contact-img" fill sizes="100vw" />
      <div className="wrap">
        <div>
          <p className="label ko" lang="ko">
            {settings.contactKorean}
          </p>
          <h2 id="commission-title">{emphasis(settings.contactHeadline)}</h2>
          <p className="lede">{settings.contactIntro}</p>
        </div>
        <CommissionForm services={services} buttonLabel={settings.contactButton} />
      </div>
    </section>
  );
}
