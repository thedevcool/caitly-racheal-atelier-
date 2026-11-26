import type { RoomWithContent } from "@/lib/content";
import { emphasis } from "@/lib/emphasis";
import { MediaImage } from "@/components/ui/MediaImage";
import { Chips, RoomTag } from "@/components/ui/RoomTag";

type SiteMeta = { nav?: string; tours?: { name: string; detail: string }[] };

/** Dusk band: a browser mockup showing a sample travel site. */
export function Studio({ room, flip }: { room: RoomWithContent; flip: boolean }) {
  const site = room.works.find((w) => w.featured) ?? room.works[0];
  const meta = (site?.meta ?? {}) as SiteMeta;
  return (
    <section className={`band tone-${room.theme}`} id={room.slug} aria-labelledby={`${room.slug}-title`}>
      <div className={`wrap room${flip ? "flip" : ""}`}>
        <div className="text">
          <RoomTag korean={room.korean} name={room.name} />
          <h2 id={`${room.slug}-title`}>{emphasis(room.headline)}</h2>
          <p className="lede">{room.body}</p>
          <Chips items={room.chips} />
          <a className="btn solid" href="#commission">
            {room.ctaLabel}
          </a>
        </div>
        {site && (
          <div
            className="browser"
            role="img"
            aria-label={`Sample website: ${site.title}, shown in a browser window`}
          >
            <div className="bar" aria-hidden="true">
              <i />
              <i />
              <i />
              {site.externalUrl && <span>{site.externalUrl.replace(/^https?:\/\//, "")}</span>}
            </div>
            <div className="site" aria-hidden="true">
              <MediaImage media={site.media} alt="" sizes="(max-width: 900px) 90vw, 700px" />
              <div className="sn">
                <b>{site.title}</b>
                {meta.nav && <span>{meta.nav}</span>}
              </div>
              <div className="hl">
                <span>{site.hook}</span>
                {site.description && <small>{site.description}</small>}
              </div>
            </div>
            {!!meta.tours?.length && (
              <div className="tours" aria-hidden="true">
                {meta.tours.slice(0, 3).map((t) => (
                  <div className="tour" key={t.name}>
                    <b>{t.name}</b>
                    <span>{t.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
