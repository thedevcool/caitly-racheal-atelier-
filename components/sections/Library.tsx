import Link from "next/link";
import type { RoomWithContent } from "@/lib/content";
import { emphasis } from "@/lib/emphasis";
import { MediaImage } from "@/components/ui/MediaImage";
import { Chips, RoomTag } from "@/components/ui/RoomTag";

/** The quiet wing: text-led, paper ground, ending in the full-width ink-wash painting. */
export function Library({ room }: { room: RoomWithContent }) {
  const painting = room.works.find((w) => w.featured && w.mediaType === "IMAGE");
  return (
    <section
      className={`band tone-${room.theme} paper`}
      id={room.slug}
      aria-labelledby={`${room.slug}-title`}
    >
      <div className="wrap">
        <div className="room" style={{ alignItems: "end" }}>
          <div>
            <RoomTag korean={room.korean} name={room.name} />
            <h2 id={`${room.slug}-title`}>{emphasis(room.headline)}</h2>
          </div>
          <div>
            <p className="lede">{room.body}</p>
            <Chips items={room.chips} />
            <div className="room-ctas">
              <a className="btn solid" href="#commission">
                {room.ctaLabel}
              </a>
              <Link className="enter" href={`/work/${room.slug}`} data-cursor="Enter">
                Enter the room <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {painting && <MediaImage media={painting.media} className="inkimg" sizes="100vw" />}
    </section>
  );
}
