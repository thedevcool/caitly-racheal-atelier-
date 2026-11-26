import Link from "next/link";
import type { RoomWithContent } from "@/lib/content";
import { emphasis } from "@/lib/emphasis";
import { toViewWork } from "@/lib/view";
import { Chips, RoomTag } from "@/components/ui/RoomTag";
import { ReelPhones } from "@/components/work/ReelPhones";

/** Lead offer. Copy on one side, three phone mockups (outer two tilted) on the other. */
export function ScreeningRoom({ room, flip }: { room: RoomWithContent; flip: boolean }) {
  const reels = room.works
    .filter((w) => w.featured)
    .slice(0, 3)
    .map(toViewWork);
  return (
    <section className="band" id={room.slug} aria-labelledby={`${room.slug}-title`}>
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
        <ReelPhones works={reels} />
      </div>
    </section>
  );
}
