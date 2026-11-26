"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import type { ViewWork } from "@/lib/view";
import { Lightbox } from "@/components/viewers/Lightbox";
import { ReelViewer } from "@/components/viewers/ReelViewer";
import { InViewVideo } from "@/components/viewers/InViewVideo";

type Props = { works: ViewWork[]; roomSlug: string; reels: boolean };

/** Filter row + responsive gallery. Reels open the reel viewer; everything else the lightbox. */
export function Gallery({ works, roomSlug, reels }: Props) {
  const categories = useMemo(
    () => [...new Set(works.map((w) => w.category).filter((c): c is string => !!c))],
    [works],
  );
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const shown = filter ? works.filter((w) => w.category === filter) : works;
  const close = useCallback(() => setOpen(null), []);

  if (!works.length) {
    return <p className="lede">New work is being hung in this room. Please check back soon.</p>;
  }

  return (
    <>
      {categories.length > 1 && (
        <div className="filters" role="group" aria-label="Filter by category">
          <button type="button" aria-pressed={filter === null} onClick={() => setFilter(null)}>
            All
          </button>
          {categories.map((c) => (
            <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <ul className={reels ? "gallery gallery-reels" : "gallery"} aria-live="polite">
        {shown.map((w, i) => {
          const still = w.poster ?? (w.mediaType === "IMAGE" ? w.media : null);
          return (
            <li key={w.id}>
              <button
                type="button"
                className="tile"
                onClick={() => setOpen(i)}
                data-cursor={reels ? "Play" : "View"}
              >
                <span className="sr-only">{reels ? "Play" : "View"} </span>
                <span className="tile-media">
                  {reels && w.mediaType === "VIDEO" && w.media ? (
                    <InViewVideo src={w.media.url} poster={w.poster?.url} aria-hidden="true" />
                  ) : (
                    still && (
                      <Image
                        src={still.url}
                        alt=""
                        width={still.width ?? 900}
                        height={still.height ?? 1125}
                        sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 400px"
                        placeholder={still.blurData ? "blur" : "empty"}
                        blurDataURL={still.blurData ?? undefined}
                      />
                    )
                  )}
                  {reels && w.hook && <span className="tile-hook">{w.hook}</span>}
                </span>
                <span className="tile-cap">
                  <b>{w.title}</b>
                  {w.category && <span>{w.category}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {reels ? (
        <ReelViewer works={shown} index={open} onClose={close} />
      ) : (
        <Lightbox works={shown} index={open} roomSlug={roomSlug} onClose={close} />
      )}
    </>
  );
}
