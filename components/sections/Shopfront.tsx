import type { RoomWithContent } from "@/lib/content";
import { emphasis } from "@/lib/emphasis";
import Link from "next/link";
import { toViewWork } from "@/lib/view";
import { FrameWall } from "@/components/work/FrameWall";
import { Chips, RoomTag } from "@/components/ui/RoomTag";

/** Ivory wall: three framed prints hung like a gallery wall, with a collection label. */
export function Shopfront({ room, flip }: { room: RoomWithContent; flip: boolean }) {
  const prints = room.works.filter((w) => w.featured && w.mediaType === "IMAGE").slice(0, 3);
  return (
    <section className={`band tone-${room.theme}`} id={room.slug} aria-labelledby={`${room.slug}-title`}>
      <div className={flip ? "wrap room flip" : "wrap room"}>
        <div className="text">
          <RoomTag korean={room.korean} name={room.name} />
          <h2 id={`${room.slug}-title`}>{emphasis(room.headline)}</h2>
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
        <div>
          <FrameWall works={prints.map(toViewWork)} roomSlug={room.slug} />
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
