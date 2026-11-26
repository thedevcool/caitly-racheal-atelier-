import type { RoomWithContent } from "@/lib/content";
import { emphasis } from "@/lib/emphasis";
import { MediaImage } from "@/components/ui/MediaImage";
import { Chips, RoomTag } from "@/components/ui/RoomTag";

/** Ivory wall: three framed prints hung like a gallery wall, with a collection label. */
export function Shopfront({ room, flip }: { room: RoomWithContent; flip: boolean }) {
  const prints = room.works.filter((w) => w.featured && w.mediaType === "IMAGE").slice(0, 3);
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
        <div>
          <div className="frames">
            {prints.map((w) => (
              <figure className="frame" key={w.id}>
                <MediaImage media={w.media} sizes="(max-width: 600px) 45vw, 270px" />
              </figure>
            ))}
          </div>
          {room.galleryTitle && (
            <p className="tag">
              <b>{room.galleryTitle}</b>
              {room.galleryCaption}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
