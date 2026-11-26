import type { RoomWithContent } from "@/lib/content";
import { emphasis } from "@/lib/emphasis";
import { MediaImage } from "@/components/ui/MediaImage";
import { Chips, RoomTag } from "@/components/ui/RoomTag";

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#EDE6DA" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

/** Lead offer. Copy on one side, three phone mockups (outer two tilted) on the other. */
export function ScreeningRoom({ room, flip }: { room: RoomWithContent; flip: boolean }) {
  const reels = room.works.filter((w) => w.featured).slice(0, 3);
  return (
    <section className="band" id={room.slug} aria-labelledby={`${room.slug}-title`}>
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
        {reels.length > 0 && (
          <div className="phones" role="group" aria-label={`${reels.length} sample vertical video ads`}>
            {reels.map((w) => (
              <figure className="phone" key={w.id}>
                <div className="notch" />
                <div className="screen">
                  {w.mediaType === "VIDEO" && w.media ? (
                    <video
                      src={w.media.url}
                      poster={w.poster?.url}
                      muted
                      loop
                      playsInline
                      preload="none"
                      aria-label={w.media.alt}
                    />
                  ) : (
                    <MediaImage media={w.poster ?? w.media} sizes="(max-width: 600px) 30vw, 260px" />
                  )}
                  <div className="play">
                    <PlayIcon />
                  </div>
                  <figcaption className="cap">
                    {w.hook && <b>{w.hook}</b>}
                    <small>{[w.title, w.category].filter(Boolean).join(" · ")}</small>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
